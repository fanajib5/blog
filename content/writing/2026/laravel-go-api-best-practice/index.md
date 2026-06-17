---
title: "Best Practice Membangun API di Laravel dan Go: Catatan dari Proyek Nyata"
description: "Pelajaran dari proyek migrasi 460+ route dan 58 controller—pola yang harus dipertahankan, yang harus ditinggalkan, dan bagaimana implementasinya di Go."
author: "Faiq Najib Al-Aziz"
date: 2026-05-07T10:28:00+07:00
lastmod: 2026-05-07T10:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - go
  - php
  - laravel
  - api
  - arsitektur
---

Di proyek migrasi PHP ke Go yang saya kerjakan, ada _phase_ di mana saya harus _audit_ semua _route_ dan _controller_ yang sudah ada. Tujuannya sederhana: sebelum migrasi, harus pahami dulu _pattern_ apa yang sudah bagus dan mana yang harus ditinggalkan. Hasilnya? _Yah_, cukup... _enlightening_ hahaha.

Proyek ini punya profil seperti ini:

- **460+ route** di `api.php`[^1]
- **58 controller** dengan berbagai ukuran dan _pattern_
- **5 auth guard**: `user-api`, `partner-api`, `open-api`, `open-api-limited`, `tms-api`
- **Rate limiting** yang bervariasi: dari 3/menit sampai 100/menit

Artikel ini bukan tutorial _"cara bikin API"_. Ini catatan _pattern_ dan _anti-pattern_ yang saya temukan, plus bagaimana _pattern_ yang sama diimplementasi di Go. Jadi kalau kamu lagi _migrate_ atau mulai proyek baru, _hopefully_ bisa _skip_ beberapa kesalahan yang sudah saya temukan hehe~

## 1. Route Organization: Kelompokkan dengan Jelas

### Apa yang Saya Temukan

Proyek ini punya struktur _route grouping_ yang _actually_ cukup bagus. Auth guard dipisah per _domain_:

```php
// routes/api.php - Struktur yang bagus
Route::group(['middleware' => ['auth:user-api']], function() {
    // 300+ route untuk user biasa
});

Route::group(['middleware' => ['auth:partner-api']], function() {
    // Route untuk partner/reseller
});

Route::group(['middleware' => ['auth:open-api']], function() {
    // Route untuk integrasi pihak ketiga
});
```

_Rate limiting_ juga diterapkan secara _strategic_:

```php
// AI analysis yang berat → rate limit ketat
Route::get('/devices/get_aicam_reports_ai', 'DeviceController@getAiCamReportsAIAnalysis')
    ->middleware('throttle:5,1');

// Command ke device → rate limit sedang
Route::post('/devices/{id}/cut_off_engine', 'DeviceController@sendFlameOffCommand')
    ->middleware('throttle:10,1');

// Google geocoding → rate limit longgar (tapi tetap ada)
Route::get('/google/reverse_geocode','GoogleController@reverseGeocodeLocation')
    ->middleware('throttle:100,1');
```

### Masalah yang Ditemukan

Tapi ada beberapa masalah:

**Masalah 1: _Naming inconsistency_.** Ada route yang pakai `snake_case`, ada yang pakai `kebab-case`, ada yang pakai verb:

```php
// Campur aduk
Route::get('/device_geofence', ...);        // snake_case
Route::get('/all_devices', ...);             // snake_case
Route::put('/update_public_key', ...);       // verb + snake_case
Route::get('/shared_device', ...);           // snake_case, tapi public
Route::resource('devices', 'DeviceController'); // RESTful
Route::post('/devices/check_device_type', ...);  // verb di bawah resource
```

**Masalah 2: _Controller_ yang terlalu banyak tanggung jawab.** `DeviceController` punya **40+ method** dan **2000+ baris kode**. Dia menangani CRUD, lokasi, laporan, perintah, _dashboard_, dan AI. _One controller to rule them all_ hahaha.

### Best Practice: Struktur Route di Go

Di Go, _route grouping_ dan _middleware_ jauh lebih _explicit_:

```go
// internal/router/router.go
func SetupRouter(
    userHandler *handler.UserHandler,
    deviceHandler *handler.DeviceHandler,
    authMiddleware middleware.AuthMiddleware,
    rateLimiter middleware.RateLimiter,
) *gin.Engine {
    r := gin.New()

    // Public routes
    r.POST("/login", userHandler.Login)
    r.POST("/register", userHandler.Register)

    // User API group
    userAPI := r.Group("/")
    userAPI.Use(authMiddleware.Guard("user-api"))
    {
        devices := userAPI.Group("/devices")
        {
            devices.GET("", deviceHandler.Index)
            devices.GET("/:id", deviceHandler.Show)
            devices.POST("", deviceHandler.Store)
            devices.PUT("/:id", deviceHandler.Update)
            devices.DELETE("/:id", deviceHandler.Destroy)

            // Device actions (sub-group dengan rate limiter)
            actions := devices.Group("/:id")
            actions.Use(rateLimiter.Limit(10, time.Minute))
            {
                actions.POST("/cut-off-engine", deviceHandler.CutOffEngine)
                actions.POST("/turn-on-engine", deviceHandler.TurnOnEngine)
            }
        }
    }

    // Partner API group
    partnerAPI := r.Group("/partner")
    partnerAPI.Use(authMiddleware.Guard("partner-api"))
    {
        partnerAPI.POST("/user-submit", partnerHandler.SubmitUser)
        partnerAPI.POST("/generate-invoice", partnerHandler.GenerateInvoice)
    }

    return r
}
```

_Kenapa ini lebih baik?_ Karena di Go, setiap _middleware chain_ dan _route group_ adalah kode eksplisit, bukan konfigurasi array. Kamu bisa _trace_ _flow_-nya secara linear, dan _IDE_ bisa _navigate_ langsung ke _handler_-nya. Tidak ada _"lho, ini route pakai middleware apa ya?"_ karena semuanya _visible_ hehe~

## 2. Controller Pattern: Kurangi, Pisahkan, _Inject_

### Anti-Pattern: Fat Controller

Mari kita lihat _real code_ dari proyek ini. Ini contoh _pattern_ yang paling sering muncul (dan sebaiknya **ditinggalkan**):

```php
// app/Http/Controllers/Auth/LoginController.php
// Pattern: validasi manual, business logic di controller

public function login(Request $request)
{
    // Validasi manual di controller
    $validator = Validator::make($request->all(),[
        'email' => 'required|string',
        'password' => 'required|string'
    ]);

    if($validator->fails()){
        return $this->sendError('Validation Error.', 400, $validator->errors());
    }

    // Business logic langsung di controller
    if ($this->attemptLogin($request)) {
        $user = Auth::user();
        $user->generateToken();

        if(isset($request->onesignal_user_id)){
            $user->setOnesignalId($request->onesignal_user_id);
        }

        if($user->terminated){
            return $this->sendError('Sorry, This account has been terminated!' ,401);
        }

        $user->updateLastLogin();
        return $this->sendResponse($user->toArray());
    } else {
        return $this->sendError('Invalid username and password' ,401);
    }
}
```

Masalahnya? Kalau kamu mau pakai _logic login_ yang sama di tempat lain (misalnya CLI command atau _job queue_), kamu harus _duplicate code_ atau _extract_ ke _service_ nanti. _Kenapa tidak dari awal saja dipisah?_ hehe~

### Anti-Pattern: Permission Check Manual

Contoh lain dari `MaintenanceLogController`:

```php
// Cek permission di setiap method, manual
private function hasMaintenanceLogAccess()
{
    if (!$this->user || !$this->user->role) {
        return false;
    }
    return $this->user->role_id == 1 || $this->user->role_id == 6;
}

public function index(Request $request)
{
    if (!$this->hasMaintenanceLogAccess()) {
        return $this->sendError('You do not have permission', 403);
    }
    // ... logic
}

public function store(Request $request)
{
    if (!$this->hasMaintenanceLogAccess()) {
        return $this->sendError('You do not have permission', 403);
    }
    // ... logic
}

// Dan seterusnya di setiap method...
```

Ini contoh _pattern_ yang seharusnya pakai **Laravel Policy** atau **Middleware**. Bayangkan kalau ada 10 method, kamu _call_ fungsi yang sama 10 kali. _DRY_ (_Don't Repeat Yourself_)[^2] itu bukan cuma _buzzword_, itu _survival strategy_ hahaha.

### Best Practice: Thin Controller + Service Layer

Di proyek yang sama, ada _controller_ yang **sudah pakai _pattern_ yang benar**. Contoh: `GeminiAIController`:

```php
// app/Http/Controllers/GeminiAIController.php
// Pattern: Form Request + Service Injection + API Resource ✅

class GeminiAIController extends AuthenticatedController
{
    protected $geminiService;

    public function __construct(GeminiAIService $geminiService)
    {
        parent::__construct();
        $this->geminiService = $geminiService;  // Dependency Injection
    }

    public function analyzeDevice(GeminiAnalyzeDeviceRequest $request)  // Form Request
    {
        try {
            $device = $this->user->devices()
                ->where('device_sn', $request->input('device_id'))
                ->first();

            if (!$device) {
                return $this->sendError('Device not found', 404);
            }

            $deviceData = $this->prepareDeviceData($device, ...);
            $result = $this->geminiService->analyzeDeviceData($deviceData, ...);  // Delegasi ke service

            return $this->sendResponse(new GeminiDeviceAnalysisResource($result));  // Resource transformation
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }
}
```

Ini _pattern_ yang harus ditiru:

1. **Form Request** untuk validasi (bukan `Validator::make()` di controller)
2. **Service Injection** untuk _business logic_ (bukan logic di controller)
3. **API Resource** untuk transformasi response (bukan `toArray()` langsung)
4. **Try-catch** di _top level_ saja

### Implementasi di Go

Di Go, _service layer_ bukan opsi, itu **keharusan**. Karena Go tidak punya _framework magic_ seperti Laravel, kamu harus _explicit_:

```go
// internal/handler/auth_handler.go
type AuthHandler struct {
    authService service.AuthService
    validator   *validator.Validate
}

func NewAuthHandler(as service.AuthService, v *validator.Validate) *AuthHandler {
    return &AuthHandler{
        authService: as,
        validator:   v,
    }
}

// Handler = thin, hanya terima request, validasi, panggil service, return response
func (h *AuthHandler) Login(c *gin.Context) {
    var req dto.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, "Invalid request body")
        return
    }

    // Validasi struct
    if err := h.validator.Struct(req); err != nil {
        response.ValidationError(c, err)
        return
    }

    // Delegasi ke service
    result, err := h.authService.Login(c.Request.Context(), req)
    if err != nil {
        switch {
        case errors.Is(err, service.ErrInvalidCredentials):
            response.Error(c, http.StatusUnauthorized, "Invalid username or password")
        case errors.Is(err, service.ErrAccountTerminated):
            response.Error(c, http.StatusUnauthorized, "Account has been terminated")
        default:
            response.Error(c, http.StatusInternalServerError, "Internal server error")
        }
        return
    }

    response.Success(c, result)
}
```

```go
// internal/service/auth_service.go
type AuthService interface {
    Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error)
}

type authService struct {
    userRepo repository.UserRepository
    tokenRepo repository.TokenRepository
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*dto.LoginResponse, error) {
    user, err := s.userRepo.FindByEmail(ctx, req.Email)
    if err != nil {
        return nil, service.ErrInvalidCredentials
    }

    if err := bcrypt.CompareHashAndPassword(
        []byte(user.Password), []byte(req.Password),
    ); err != nil {
        return nil, service.ErrInvalidCredentials
    }

    if user.Terminated {
        return nil, service.ErrAccountTerminated
    }

    token, err := s.tokenRepo.Create(ctx, user.ID)
    if err != nil {
        return nil, err
    }

    return &dto.LoginResponse{
        User:  dto.NewUserResponse(user),
        Token: token,
    }, nil
}
```

_Perbedaan utama dari PHP/Laravel_: tidak ada _inheritance_, tidak ada _magic method_, tidak ada _middleware constructor_. Semuanya _explicit_ lewat _dependency injection_. Awalnya memang terasa lebih banyak _boilerplate_—dan iya, memang lebih banyak—tapi _trade-off_-nya adalah setiap _layer_ bisa di-_test_ secara _independen_, dan _flow_ data selalu terlihat jelas. Tidak ada yang tersembunyi di belakang layar hehe~

## 3. Validasi: Konsisten, Satu Cara, di Satu Tempat

### Apa yang Saya Temukan

Di proyek ini ada **tiga cara validasi** yang dipakai secara bersamaan:

**Cara 1: Manual `Validator::make()`** (paling umum, 80%+ _controller_):
```php
$validator = Validator::make($request->all(), [
    'email' => 'required|string',
    'password' => 'required|string'
]);
if($validator->fails()){
    return $this->sendError('Validation Error.', 400, $validator->errors());
}
```

**Cara 2: Inline `$request->validate()`**:
```php
$validated = $request->validate([
    'start_dt' => 'required|date',
    'end_dt' => 'required|date|after_or_equal:start_dt',
    'group_id' => 'nullable|integer',
]);
```

**Cara 3: Form Request** (paling sedikit, tapi paling bersih):
```php
// app/Http/Requests/GeminiAnalyzeDeviceRequest.php
class GeminiAnalyzeDeviceRequest extends FormRequest
{
    public function rules()
    {
        return [
            'device_id' => 'required|string',
            'analysis_type' => 'nullable|in:general,performance,behavior',
            'date_range' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:1000',
        ];
    }
}
```

Masalah dengan cara 1 dan 2? Kalau ada 5 _endpoint_ yang membutuhkan validasi `device_id`, kamu nulis rule yang sama 5 kali. Dan kalau _rule_-nya berubah, kamu harus cari dan update di 5 tempat berbeda. _Fun times_ hahaha.

### Best Practice

**Gunakan Form Request secara konsisten.** Alasannya:

1. **Reusable**: satu _form request_ bisa dipakai di banyak _endpoint_
2. **Testable**: _form request_ bisa di-_test_ secara _independen_ tanpa _hit endpoint_
3. **Readable**: semua _rule_ di satu tempat, tidak tersebar di _controller_
4. **Auto-documentation**: kalau pakai _tool_ seperti Swagger/L5-Swagger, _form request_ otomatis ter-_generate_ docs-nya

### Implementasi di Go

Di Go, validasi pakai _struct tags_:

```go
// internal/dto/request.go
type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

type AnalyzeDeviceRequest struct {
    DeviceID     string `json:"device_id" validate:"required"`
    AnalysisType string `json:"analysis_type" validate:"omitempty,oneof=general performance behavior"`
    DateRange    string `json:"date_range" validate:"omitempty"`
    Limit        int    `json:"limit" validate:"omitempty,min=1,max=1000"`
}
```

_Keenangan_: di Go, karena struct adalah _first-class citizen_, validasi otomatis ter-_attach_ ke tipe data. Tidak mungkin ada _"lho, validasi mana yang dipakai di _endpoint_ ini?"_ karena struct-nya langsung _visible_ di _handler_ signature hehe~

## 4. Response Consistency: Satu Format, Semua Endpoint

### Apa yang Saya Temukan

Proyek ini punya _base controller_ yang lumayan bagus:

```php
// app/Http/Controllers/Controller.php
class Controller extends BaseController
{
    public function sendResponse($result = "", $message = "OK")
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $result,
        ], 200);
    }

    public function sendError($error, $code = 400, $errorMessages = [])
    {
        $response = [
            'success' => false,
            'message' => $error,
        ];
        if(!empty($errorMessages)){
            $response['errors'] = $errorMessages;
        }
        return response()->json($response, $code);
    }
}
```

Bagus kan? Tapi... ada _yang nyelip_:

```php
// loginOauth() pakai format beda!
return response()->json([
    'ResponseCode' => 0,           // ❌ beda format
    "ResponseString" => 'OK',      // ❌ beda key
    "data" => new UserOauthResource($user)
], 200);

// Sedangkan login() pakai format standard
return $this->sendResponse($user->toArray());  // ✅ konsisten
```

Bayangkan _frontend developer_ yang harus _handle_ dua format response berbeda untuk _endpoint login_ yang pada dasarnya sama. Pasti _mental_ dia _"why tho?"_ hahaha.

### Best Practice

**Satu format response, semua _endpoint_, tidak ada pengecualian.** Kalau perlu _versioning_, pakai _header_ atau _URL prefix_, bukan _format response_ yang berbeda.

```php
// Gunakan API Resource secara konsisten
return $this->sendResponse(new UserResource($user));

// Untuk collection dengan pagination
return $this->sendResponse([
    'devices' => DeviceResource::collection($devices),
    'meta' => new PaginationResource($devices),
]);
```

### Implementasi di Go

```go
// internal/pkg/response/response.go
type Response struct {
    Success bool   `json:"success"`
    Message string `json:"message"`
    Data    any    `json:"data,omitempty"`
    Errors  any    `json:"errors,omitempty"`
}

func Success(c *gin.Context, data any) {
    c.JSON(http.StatusOK, Response{
        Success: true,
        Message: "OK",
        Data:    data,
    })
}

func Error(c *gin.Context, code int, message string) {
    c.JSON(code, Response{
        Success: false,
        Message: message,
    })
}

func ValidationError(c *gin.Context, err error) {
    c.JSON(http.StatusBadRequest, Response{
        Success: false,
        Message: "Validation Error",
        Errors:  formatValidationErrors(err),
    })
}
```

Dengan _helper function_ ini, semua _handler_ pasti mengembalikan format yang sama. Tidak ada lagi _"loh, ini _endpoint_ pakai `ResponseCode` atau `success`?"_ karena tinggal panggil `response.Success()` atau `response.Error()`. _Done_. _Simple_, _predictable_, _happy frontend developer_ hehe~

## 5. Auth & Authorization: Guard, bukan Manual Check

### Apa yang Saya Temukan

Proyek ini punya _auth guard_ yang cukup matang:

```php
// 5 guard untuk 5 domain berbeda
Route::group(['middleware' => ['auth:user-api']], function() { ... });
Route::group(['middleware' => ['auth:partner-api']], function() { ... });
Route::group(['middleware' => ['auth:open-api']], function() { ... });
Route::group(['middleware' => ['auth:open-api-limited']], function() { ... });
Route::group(['middleware' => ['auth:tms-api']], function() { ... });
```

Dan ada _middleware_ khusus untuk device-level authorization:

```php
// Device ownership check via middleware
Route::group(['middleware' => 'user_device_auth'], function() {
    Route::resource('devices', 'DeviceController');
    Route::get('/devices/{id}/last_location', 'DeviceController@lastLocation');
    // ...
});
```

Ini bagus. Tapi masalahnya ada di `AuthenticatedController`:

```php
class AuthenticatedController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            // ❌ Manual token validation di constructor
            $this->user = Auth::guard('user-api')->user();
            $token = $request->bearerToken();
            $valid = Helper::validateToken($token);

            if(!$valid){
                return response()->json(['error' => 'Invalid Token'], 401);
            } elseif($this->user->terminated) {
                return response()->json(['message' => 'Sorry...'], 401);
            } else {
                return $next($request);
            }
        });
    }
}
```

Kenapa ini masalah? Karena _token validation logic_ di-_embed_ di _constructor_ _controller_, bukan di _dedicated middleware_. Artinya:

- Tidak bisa dipakai di _controller_ yang tidak _extend_ `AuthenticatedController`
- Sulit di-_test_ secara _independen_
- Kalau logic-nya berubah, harus ubah di _constructor_ ini

### Best Practice

Pisahkan _concern_:

```php
// app/Http/Middleware/ValidateApiToken.php
class ValidateApiToken
{
    public function handle($request, Closure $next)
    {
        $token = $request->bearerToken();
        if (!Helper::validateToken($token)) {
            return response()->json(['error' => 'Invalid Token'], 401);
        }
        return $next($request);
    }
}

// app/Http/Middleware/CheckNotTerminated.php
class CheckNotTerminated
{
    public function handle($request, Closure $next)
    {
        $user = Auth::guard('user-api')->user();
        if ($user->terminated) {
            return response()->json(['message' => 'Account terminated'], 401);
        }
        return $next($request);
    }
}
```

Dengan ini, _middleware_ bisa di-_compose_ dan di-_test_ secara _independen_.

### Implementasi di Go

```go
// internal/middleware/auth.go
func (m *AuthMiddleware) Guard(guardName string) gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            response.Error(c, http.StatusUnauthorized, "Missing authorization token")
            c.Abort()
            return
        }

        claims, err := m.tokenService.ValidateToken(c, token)
        if err != nil {
            response.Error(c, http.StatusUnauthorized, "Invalid token")
            c.Abort()
            return
        }

        // Guard-specific checks
        switch guardName {
        case "user-api":
            if claims.Type != "user" {
                response.Error(c, http.StatusForbidden, "Invalid token type")
                c.Abort()
                return
            }
            user, err := m.userRepo.FindByID(c, claims.UserID)
            if err != nil || user.Terminated {
                response.Error(c, http.StatusUnauthorized, "Account terminated")
                c.Abort()
                return
            }
            c.Set("user", user)
        case "partner-api":
            // Partner-specific validation...
        }

        c.Next()
    }
}

// Penggunaan di router
userAPI := r.Group("/")
userAPI.Use(authMiddleware.Guard("user-api"))
```

Di Go, karena setiap _middleware_ adalah fungsi yang bisa di-_compose_, kamu bisa _mix and match_ sesuai kebutuhan tanpa _inheritance chain_ yang _rumit_. _Composition over inheritance_[^3] bukan cuma _jargon_, di Go itu cara hidup hahaha.

## 6. Pecah Fat Controller jadi Handler Terpisah

### Masalah Besar

`DeviceController` punya **40+ method**. Mari bayangkan: kalau ada _bug_ di fitur _report_, kamu harus _scroll_ melewati 1000+ baris kode fitur lokasi, fitur perintah, fitur _dashboard_... baru nemu yang kamu cari. _Developer experience_-nya kurang lebih kayak cari jarum di tumpukan jerami, tapi jeraminya _code_ hahaha.

### Solusi: Satu Domain = Satu Handler

Di Go, ini terjadi secara _natural_ karena Go tidak punya _class inheritance_. Setiap _handler_ adalah struct terpisah:

```go
// internal/handler/device_handler.go - CRUD only
type DeviceHandler struct {
    deviceService service.DeviceService
}

func (h *DeviceHandler) Index(c *gin.Context)   { ... }
func (h *DeviceHandler) Show(c *gin.Context)    { ... }
func (h *DeviceHandler) Store(c *gin.Context)   { ... }
func (h *DeviceHandler) Update(c *gin.Context)  { ... }
func (h *DeviceHandler) Destroy(c *gin.Context) { ... }

// internal/handler/device_report_handler.go - Reports only
type DeviceReportHandler struct {
    reportService service.DeviceReportService
}

func (h *DeviceReportHandler) GetSummaryRoute(c *gin.Context) { ... }
func (h *DeviceReportHandler) GetStopReport(c *gin.Context)   { ... }
func (h *DeviceReportHandler) GetFuelReport(c *gin.Context)   { ... }

// internal/handler/device_command_handler.go - Commands only
type DeviceCommandHandler struct {
    commandService service.DeviceCommandService
}

func (h *DeviceCommandHandler) CutOffEngine(c *gin.Context) { ... }
func (h *DeviceCommandHandler) TurnOnEngine(c *gin.Context) { ... }
```

_Tips migrasi_: Sebelum konversi ke Go, _pecah dulu_ _controller_ PHP-mu menjadi _handler_ yang lebih kecil. Ini membuat proses migrasi jauh lebih mudah karena setiap _handler_ sudah punya _scope_ yang jelas. _Clean before you move_, bukan _move then clean_ hehe~

## Ringkasan: Checklist Best Practice

Berikut _checklist_ yang bisa langsung kamu pakai:

| Aspek | ❌ Jangan | ✅ Lakukan |
|-------|-----------|-----------|
| Validasi | `Validator::make()` di controller | Form Request / struct tags |
| Business Logic | Langsung di controller | Pisah ke service layer |
| Response | Format beda-beda per endpoint | Satu format konsisten |
| Permission | Manual check di setiap method | Policy / Middleware |
| Controller | Satu controller 40+ method | Pecah per domain |
| Route naming | Campur snake_case/kebab-case | Konsisten satu style |
| Rate limiting | Hanya di route yang "berbahaya" | Semua endpoint yang _expensive_ |
| Auth | Logic di constructor controller | Dedicated middleware |

## Penutup

_Best practice_ itu bukan soal _"cara yang paling sempurna"_. Tapi soal **konsistensi**. Lebih baik konsisten pakai _pattern_ yang "cukup bagus" di seluruh _codebase_, daripada _mix and match_ _pattern_ "sempurna" yang bikin _developer_ baru bingung harus ikut yang mana.

Dan kalau kamu sekarang lagi menatap _codebase_ yang punya 40 _method_ di satu _controller_, tiga cara validasi berbeda, dan _response format_ yang tidak konsisten — tenang. Banyak yang sudah lewat fase itu. Termasuk saya. Bedanya, sekarang ada catatan ini hehe~

Kalau kamu sedang _migrate_ dari PHP ke Go, atau mau mulai proyek baru dengan arsitektur yang lebih bersih, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

Terima kasih buat yang sudah tersasar ke sini dan membaca sampai akhir. Semoga bermanfaat!

Sekian. Salam.

[^1]: Angka ini termasuk _public route_, _authenticated route_, _partner route_, dan berbagai integrasi. _Yah_, cukup banyak untuk di-_audit_ satu-satu hahaha.
[^2]: _DRY (Don't Repeat Yourself)_ — prinsip yang sederhana tapi sering dilupakan saat _deadline_ mendekat. _Guilty as charged_ hehe~
[^3]: _Composition over inheritance_ — prinsip di mana lebih baik menyusun _behavior_ dari komponen-komponen kecil daripada membuat _inheritance tree_ yang dalam. Di Go, ini bukan pilihan, tapi _default_.
