---
title: "Best Practice Membangun API di Laravel dan Go: Catatan dari Proyek Nyata"
description: "Catatan dari audit 460+ route dan 58 controller di proyek migrasi PHP ke Go: pola yang layak dipertahankan, yang sebaiknya ditinggal, dan versi Go-nya."
author: "Faiq Najib Al-Aziz"
date: 2026-05-07T10:28:00+07:00
lastmod: 2026-09-11T09:28:00+07:00
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

Di proyek migrasi PHP ke Go yang saya kerjakan, saya mengaudit semua _route_ dan _controller_ yang ada. Sebelum migrasi, saya harus tahu _pattern_ mana yang layak dibawa dan mana yang lebih baik ditinggal. Hasil auditnya lumayan bikin melek, hahaha.

Profil proyeknya begini:

- **460+ route** di `api.php`[^1]
- **58 controller** dengan ukuran dan _pattern_ yang macam-macam
- **5 auth guard**: `user-api`, `partner-api`, `open-api`, `open-api-limited`, `tms-api`
- **Rate limiting** yang bervariasi: dari 3/menit sampai 100/menit

Ini bukan tutorial _"cara bikin API"_. Ini catatan tentang _pattern_ dan _anti-pattern_ yang saya temukan, plus contoh penerapannya di Go. Kalau kamu sedang _migrate_ atau mulai proyek baru, semoga bisa membantu menghindari beberapa kesalahan yang sudah saya temui duluan.

## 1. Route Organization: Kelompokkan dengan Jelas

### Apa yang Saya Temukan

Proyek ini ternyata punya struktur _route grouping_ yang cukup bagus. Auth guard dipisah per _domain_:

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

_Rate limiting_ juga dipasang dengan perhitungan:

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

Tapi ya, ada beberapa masalah:

**Masalah 1: _Naming inconsistency_.** Ada route yang pakai `snake_case`, ada yang `kebab-case`, ada yang pakai verb:

```php
// Campur aduk
Route::get('/device_geofence', ...);        // snake_case
Route::get('/all_devices', ...);             // snake_case
Route::put('/update_public_key', ...);       // verb + snake_case
Route::get('/shared_device', ...);           // snake_case, tapi public
Route::resource('devices', 'DeviceController'); // RESTful
Route::post('/devices/check_device_type', ...);  // verb di bawah resource
```

**Masalah 2: _Controller_ yang kebanyakan tanggung jawab.** `DeviceController` punya **40+ method** dan **2000+ baris kode**. Isinya CRUD, lokasi, laporan, perintah, _dashboard_, sampai AI. _One controller to rule them all_ hahaha.

### Best Practice: Struktur Route di Go

Di contoh Go ini, _route grouping_ dan _middleware_ ditulis secara _explicit_:

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

Di sini setiap _middleware chain_ dan _route group_ ditulis sebagai kode, bukan konfigurasi array. Alurnya bisa dibaca dari atas ke bawah, dan _IDE_ bisa langsung lompat ke definisi _handler_. Middleware yang dipakai tiap route kelihatan di tempat route itu didaftarkan.

## 2. Controller Pattern: Kurangi, Pisahkan, _Inject_

### Anti-Pattern: Fat Controller

Coba kita lihat _real code_ dari proyek ini. Ini _pattern_ yang paling sering muncul (dan sebaiknya **ditinggal**):

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

Kalau _logic login_ yang sama dibutuhkan di tempat lain, misalnya CLI command atau _job queue_, kodenya harus diduplikasi atau diekstrak ke _service_. Lebih enak dipisah dari awal.

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

Kasus ini lebih cocok ditangani **Laravel Policy** atau **Middleware**. Kalau ada 10 method, ya jangan panggil dan rawat fungsi yang sama 10 kali. Prinsip _DRY_ (_Don't Repeat Yourself_)[^2] memang dibuat untuk situasi begini.

### Best Practice: Thin Controller + Service Layer

Di proyek yang sama, ada _controller_ yang **sudah benar _pattern_-nya**. Contohnya `GeminiAIController`:

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

Ini _pattern_ yang layak ditiru:

1. **Form Request** untuk validasi (bukan `Validator::make()` di controller)
2. **Service Injection** untuk _business logic_ (bukan logic di controller)
3. **API Resource** untuk transformasi response (bukan `toArray()` langsung)
4. **Try-catch** di _top level_ saja

### Implementasi di Go

Contoh Go berikut memisahkan _business logic_ ke _service layer_. Tanpa _framework magic_ ala Laravel, dependensi dan alur pemanggilan ditulis secara _explicit_:

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

Di contoh ini tidak ada _inheritance_, _magic method_, atau _middleware constructor_. Dependensi diberikan secara _explicit_ lewat _dependency injection_. Memang lebih banyak _boilerplate_ (capek ngetiknya, jujur), tapi tiap _layer_ bisa diuji sendiri-sendiri dan alur datanya kelihatan jelas.

## 3. Validasi: Konsisten, Satu Cara, di Satu Tempat

### Apa yang Saya Temukan

Di proyek ini ada **tiga cara validasi** yang dipakai bersamaan:

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

Dengan cara 1 dan 2, rule `device_id` bisa tertulis berulang di beberapa _endpoint_. Begitu rule berubah, semua salinannya harus ikut diperbarui (dan pasti ada satu yang kelewat).

### Best Practice

**Pakai Form Request untuk aturan yang perlu dikelola bersama.** Manfaatnya:

1. **Reusable**: satu _form request_ bisa dipakai di beberapa _endpoint_ yang memakai aturan sama
2. **Testable**: _form request_ bisa di-_test_ secara _independen_ tanpa _hit endpoint_
3. **Readable**: semua _rule_ di satu tempat, tidak tersebar di _controller_
4. **Dokumentasi**: _form request_ dapat menjadi sumber informasi saat menyusun dokumentasi dengan _tool_ seperti Swagger/L5-Swagger

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

Di contoh Go ini, rule validasi ditulis sebagai _struct tags_ dan diperiksa di _handler_. Jadi aturan yang berlaku kelihatan bersama tipe request-nya.

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

Bayangkan _frontend developer_ yang harus _handle_ dua format response berbeda untuk _endpoint login_ yang pada dasarnya sama. Pasti dalam hati dia bertanya, _"kenapa harus begini?"_ hahaha.

### Best Practice

**Usahakan satu format response untuk semua _endpoint_.** Kalau butuh _versioning_, pakai _header_ atau _URL prefix_, jangan ubah _format response_.

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

Selama _handler_ memakai _helper function_ ini, bentuk _response_-nya pasti sama. Sukses panggil `response.Success()`, error panggil `response.Error()`. Selesai.

## 5. Auth & Authorization: Guard, bukan Manual Check

### Apa yang Saya Temukan

Proyek ini memakai lima _auth guard_ untuk domain yang berbeda:

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

Kenapa ini masalah? Karena _token validation logic_ ditanam di _constructor_ _controller_, bukan di _dedicated middleware_. Akibatnya:

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

Di Go, _middleware_ cuma fungsi yang bisa di-_compose_ sesuai kebutuhan, tanpa _inheritance chain_. Prinsip _composition over inheritance_[^3] cocok dengan pendekatan ini.

## 6. Pecah Fat Controller jadi Handler Terpisah

### Masalah Besar

`DeviceController` punya **40+ method**. Kalau ada _bug_ di fitur _report_, kamu harus melewati kode fitur lokasi, perintah, dan _dashboard_ dulu sebelum ketemu yang dicari. Mencari satu _method_ di antara 1000+ baris itu bukan pengalaman yang menyenangkan (percayalah).

### Solusi: Satu Domain = Satu Handler

Untuk memisahkan tanggung jawab di Go, tiap _handler_ bisa ditaruh di struct sendiri:

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

_Tips migrasi_: Sebelum konversi ke Go, pecah _controller_ PHP menjadi _handler_ yang lebih kecil. Dengan begitu, tiap _handler_ sudah punya _scope_ yang jelas saat mulai dipindahkan.

## Ringkasan: Checklist Best Practice

Ini _checklist_ dari pola-pola di atas:

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

Dari audit ini, yang paling terasa buat saya adalah soal **konsistensi**. Di _codebase_ yang saya lihat, lebih enak mengikuti _pattern_ yang cukup baik tapi dipakai bersama, daripada lompat-lompat antar _pattern_ yang katanya sempurna.

Kalau kamu sedang menatap _codebase_ dengan 40 _method_ di satu _controller_, tiga cara validasi, dan _response format_ yang tidak konsisten, tenang, kamu tidak sendirian. Saya juga menemukan campuran seperti ini. Mulai benahi satu pola dulu saja.

Kalau kamu sedang _migrate_ dari PHP ke Go, atau mau mulai proyek baru dengan arsitektur yang lebih rapi, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

Terima kasih sudah membaca sampai akhir!

[^1]: Angka ini termasuk _public route_, _authenticated route_, _partner route_, dan berbagai integrasi. Cukup banyak untuk di-_audit_ satu per satu.
[^2]: _DRY (Don't Repeat Yourself)_ adalah prinsip sederhana yang mudah dilupakan saat _deadline_ mendekat.
[^3]: _Composition over inheritance_ adalah prinsip menyusun _behavior_ dari komponen-komponen kecil alih-alih membuat _inheritance tree_ yang dalam. Pendekatan ini digunakan dalam contoh Go di atas.
