---
title: "Best Practices for Building APIs in Laravel and Go: Notes from a Real Project"
description: "Lessons from auditing 460+ routes and 58 controllers—patterns to keep, patterns to ditch, and how each maps to Go."
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
  - architecture
---

While working on a PHP-to-Go migration, I audited the existing routes and controllers. Before moving them, I needed to see which patterns were worth keeping and which should go. The audit was eye-opening, hahaha.

The project profile looked like this:

- **460+ routes** in `api.php`[^1]
- **58 controllers** of various sizes and patterns
- **5 auth guards**: `user-api`, `partner-api`, `open-api`, `open-api-limited`, `tms-api`
- **Varied rate limiting**: from 3/minute up to 100/minute

This isn't a _"how to build an API"_ tutorial. It's a record of the patterns and anti-patterns I found, with examples of how they map to Go. If you're migrating or starting a project, I hope these notes help you avoid a few of the same mistakes.

## 1. Route Organization: Group with Intention

### What I Found

The project had route grouping that was actually pretty well-structured. Auth guards were separated by domain:

```php
// routes/api.php - Good structure
Route::group(['middleware' => ['auth:user-api']], function() {
    // 300+ routes for regular users
});

Route::group(['middleware' => ['auth:partner-api']], function() {
    // Routes for partners/resellers
});

Route::group(['middleware' => ['auth:open-api']], function() {
    // Routes for third-party integrations
});
```

Rate limiting was also applied strategically:

```php
// Heavy AI analysis → strict rate limit
Route::get('/devices/get_aicam_reports_ai', 'DeviceController@getAiCamReportsAIAnalysis')
    ->middleware('throttle:5,1');

// Device commands → moderate rate limit
Route::post('/devices/{id}/cut_off_engine', 'DeviceController@sendFlameOffCommand')
    ->middleware('throttle:10,1');

// Google geocoding → relaxed rate limit (but still present)
Route::get('/google/reverse_geocode','GoogleController@reverseGeocodeLocation')
    ->middleware('throttle:100,1');
```

### Problems Found

But there were issues:

**Issue 1: Naming inconsistency.** Some routes used `snake_case`, others used `kebab-case`, and some used verbs:

```php
// All mixed together
Route::get('/device_geofence', ...);        // snake_case
Route::get('/all_devices', ...);             // snake_case
Route::put('/update_public_key', ...);       // verb + snake_case
Route::get('/shared_device', ...);           // snake_case, but public
Route::resource('devices', 'DeviceController'); // RESTful
Route::post('/devices/check_device_type', ...);  // verb under resource
```

**Issue 2: Controllers doing too much.** `DeviceController` had **40+ methods** and **2000+ lines of code**. It handled CRUD, location tracking, reports, commands, dashboards, and AI. _One controller to rule them all_ hahaha.

### Best Practice: Route Structure in Go

In this Go example, route groups and middleware are written explicitly:

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

            // Device actions (sub-group with rate limiter)
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

Here, each middleware chain and route group is code rather than array configuration. You can follow the flow from top to bottom, and your IDE can open a handler's definition directly. The middleware for each route is visible where the route is registered.

## 2. Controller Pattern: Thin, Separated, Injected

### Anti-Pattern: Fat Controller

Let's look at real code from this project. Here's the pattern that appears most often (and should **be avoided**):

```php
// app/Http/Controllers/Auth/LoginController.php
// Pattern: manual validation, business logic in controller

public function login(Request $request)
{
    // Manual validation in controller
    $validator = Validator::make($request->all(),[
        'email' => 'required|string',
        'password' => 'required|string'
    ]);

    if($validator->fails()){
        return $this->sendError('Validation Error.', 400, $validator->errors());
    }

    // Business logic directly in controller
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

If the same login logic is needed elsewhere, such as in a CLI command or job queue, it would have to be duplicated or extracted into a service. Separating it from the start avoids that extra step.

### Anti-Pattern: Manual Permission Checks

Another example from `MaintenanceLogController`:

```php
// Permission check in every method, manually
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

// And so on in every method...
```

This is a good fit for a **Laravel Policy** or **Middleware**. With 10 methods, there is no need to repeat and maintain the same check in each one. DRY (_Don't Repeat Yourself_)[^2] helps avoid that duplication.

### Best Practice: Thin Controller + Service Layer

In the same project, there's a controller that **already follows the right pattern**. Example: `GeminiAIController`:

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
            $result = $this->geminiService->analyzeDeviceData($deviceData, ...);  // Delegate to service

            return $this->sendResponse(new GeminiDeviceAnalysisResource($result));  // Resource transformation
        } catch (\Exception $e) {
            return $this->sendError($e->getMessage(), 500);
        }
    }
}
```

This is the pattern to follow:

1. **Form Request** for validation (not `Validator::make()` in controller)
2. **Service Injection** for business logic (not logic in controller)
3. **API Resource** for response transformation (not raw `toArray()`)
4. **Try-catch** only at the top level

### Implementation in Go

The Go example below puts business logic in a service layer. Without Laravel's framework magic, dependencies and calls need to be wired explicitly:

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

// Handler = thin: receive request, validate, call service, return response
func (h *AuthHandler) Login(c *gin.Context) {
    var req dto.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, http.StatusBadRequest, "Invalid request body")
        return
    }

    // Struct validation
    if err := h.validator.Struct(req); err != nil {
        response.ValidationError(c, err)
        return
    }

    // Delegate to service
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
    userRepo  repository.UserRepository
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

In this example, there is no inheritance, magic method, or constructor middleware. Dependencies are passed explicitly through dependency injection. That adds boilerplate, but each layer can be tested independently and the data flow is visible.

## 3. Validation: Consistent, One Approach, One Place

### What I Found

The project used **three validation approaches** simultaneously:

**Approach 1: Manual `Validator::make()`** (most common, 80%+ of controllers):
```php
$validator = Validator::make($request->all(), [
    'email' => 'required|string',
    'password' => 'required|string'
]);
if($validator->fails()){
    return $this->sendError('Validation Error.', 400, $validator->errors());
}
```

**Approach 2: Inline `$request->validate()`**:
```php
$validated = $request->validate([
    'start_dt' => 'required|date',
    'end_dt' => 'required|date|after_or_equal:start_dt',
    'group_id' => 'nullable|integer',
]);
```

**Approach 3: Form Request** (least used, but cleanest):
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
            'limit' => 'nullable|integer|min:1|max=1000',
        ];
    }
}
```

With approaches 1 and 2, the `device_id` rule can be repeated across endpoints. When it changes, each copy needs an update.

### Best Practice

**Use Form Requests for rules that need to be managed together.** They offer a few benefits:

1. **Reusable**: one form request can serve several endpoints that use the same rules
2. **Testable**: form requests can be tested independently without hitting endpoints
3. **Readable**: all rules in one place, not scattered across controllers
4. **Documentation**: a form request can be a source of information when building docs with tools like Swagger/L5-Swagger

### Implementation in Go

In Go, validation uses struct tags:

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

In this Go example, validation rules are written as struct tags and checked in the handler. The applicable rules are visible alongside the request type.

## 4. Response Consistency: One Format, All Endpoints

### What I Found

The project had a decent base controller:

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

Looks good, right? But... there's an outlier:

```php
// loginOauth() uses a different format!
return response()->json([
    'ResponseCode' => 0,           // ❌ different format
    "ResponseString" => 'OK',      // ❌ different keys
    "data" => new UserOauthResource($user)
], 200);

// While login() uses the standard format
return $this->sendResponse($user->toArray());  // ✅ consistent
```

Imagine being the frontend developer handling two different response formats for essentially the same login endpoint. No wonder they'd ask, _"why does it have to be like this?"_ hahaha.

### Best Practice

**Aim for one response format across endpoints.** If you need versioning, use headers or URL prefixes rather than changing the response format.

```php
// Use API Resources consistently
return $this->sendResponse(new UserResource($user));

// For collections with pagination
return $this->sendResponse([
    'devices' => DeviceResource::collection($devices),
    'meta' => new PaginationResource($devices),
]);
```

### Implementation in Go

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

As long as handlers use these helpers, the response shape stays consistent. Call `response.Success()` for a successful result or `response.Error()` for an error.

## 5. Auth & Authorization: Guards, Not Manual Checks

### What I Found

The project used five auth guards for different domains:

```php
// 5 guards for 5 different domains
Route::group(['middleware' => ['auth:user-api']], function() { ... });
Route::group(['middleware' => ['auth:partner-api']], function() { ... });
Route::group(['middleware' => ['auth:open-api']], function() { ... });
Route::group(['middleware' => ['auth:open-api-limited']], function() { ... });
Route::group(['middleware' => ['auth:tms-api']], function() { ... });
```

And a custom middleware for device-level authorization:

```php
// Device ownership check via middleware
Route::group(['middleware' => 'user_device_auth'], function() {
    Route::resource('devices', 'DeviceController');
    Route::get('/devices/{id}/last_location', 'DeviceController@lastLocation');
    // ...
});
```

This is good. But the problem is in `AuthenticatedController`:

```php
class AuthenticatedController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            // ❌ Manual token validation embedded in constructor
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

Why is this a problem? Because token validation logic is embedded in the controller constructor, not in a dedicated middleware. This means:

- Can't be used in controllers that don't extend `AuthenticatedController`
- Hard to test independently
- If the logic changes, you have to modify this constructor

### Best Practice

Separate concerns:

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

This way, middleware can be composed and tested independently.

### Implementation in Go

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

// Usage in router
userAPI := r.Group("/")
userAPI.Use(authMiddleware.Guard("user-api"))
```

In Go, middleware functions can be composed as needed without complex inheritance chains. The _composition over inheritance_[^3] principle fits this approach.

## 6. Split Fat Controllers into Separate Handlers

### The Big Problem

`DeviceController` had **40+ methods**. A bug in the report feature meant scrolling past location, command, and dashboard code to find the relevant method. Searching through more than 1000 lines for one method is not a pleasant experience.

### Solution: One Domain = One Handler

To separate responsibilities in Go, each handler can live in its own struct:

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

_Migration tip_: Before converting to Go, split PHP controllers into smaller handlers. Each handler will then have a clear scope when you start moving it.

## Summary: Best Practice Checklist

Here's a checklist drawn from the patterns discussed:

| Aspect | ❌ Don't | ✅ Do |
|--------|----------|-------|
| Validation | `Validator::make()` in controller | Form Request / struct tags |
| Business Logic | Directly in controller | Separate into service layer |
| Response | Different formats per endpoint | One consistent format |
| Permission | Manual check in every method | Policy / Middleware |
| Controller | One controller with 40+ methods | Split by domain |
| Route naming | Mix of snake_case/kebab-case | Consistent single style |
| Rate limiting | Only on "dangerous" routes | All expensive endpoints |
| Auth | Logic in controller constructor | Dedicated middleware |

## Closing Thoughts

The clearest lesson from this audit, for me, was the value of **consistency**. In the codebase I looked at, a decent pattern used consistently is easier to follow than a mix of patterns each treated as perfect.

If you're looking at a codebase with 40 methods in one controller, three validation styles, and inconsistent response formats, start by improving one pattern. I found the same mix during this audit.

If you're migrating from PHP to Go, or want to start a new project with cleaner architecture, [get in touch](/en/contact/). Or check out my [services](/en/services/) to see how I can help.

Thanks for reading to the end. I hope these notes help when you're auditing an API or preparing a migration.

That's all. Cheers.

[^1]: This number includes public routes, authenticated routes, partner routes, and various integrations. Quite a lot to audit one by one.
[^2]: DRY (Don't Repeat Yourself) is a simple principle that's easy to forget as a deadline approaches.
[^3]: Composition over inheritance is the principle of building behavior from small components rather than deep inheritance trees. The Go examples above use this approach.
