export type Lang = "en" | "es";

export interface CodeBlock {
  label: string;
  language: string;
  code: string;
}

export interface DocSection {
  id: string;
  group: string;
  title: string;
  description: string;
  body: string[];
  bullets?: string[];
  code?: CodeBlock[];
  table?: { columns: string[]; rows: string[][] };
}

export interface LocaleContent {
  lang: Lang;
  label: string;
  switchLabel: string;
  searchPlaceholder: string;
  noResults: string;
  title: string;
  subtitle: string;
  installCommand: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badges: string[];
  sections: DocSection[];
}

const quickStartCode = {
  en: `npm install -g @varbyte/nest-worker-cli
nest-worker new my-api
cd my-api
npm install
nest-worker generate resource users
npm run dev`,
  es: `npm install -g @varbyte/nest-worker-cli
nest-worker new mi-api
cd mi-api
npm install
nest-worker generate resource users
npm run dev`,
};

const generatedTreeCode = {
  en: `my-api/
├─ package.json
├─ pnpm-workspace.yaml
├─ wrangler.toml
├─ tsconfig.json
└─ src/
   ├─ worker.ts
   ├─ common/
   │  ├─ filters/app-error.filter.ts
   │  └─ exceptions/app.exception.ts
   ├─ config/app.config.ts
   ├─ database/migrations/.gitkeep
   └─ modules/
      ├─ app/
      │  ├─ app.controller.ts
      │  ├─ app.module.ts
      │  └─ app.service.ts
      └─ health/health.controller.ts`,
  es: `mi-api/
├─ package.json
├─ pnpm-workspace.yaml
├─ wrangler.toml
├─ tsconfig.json
└─ src/
   ├─ worker.ts
   ├─ common/
   │  ├─ filters/app-error.filter.ts
   │  └─ exceptions/app.exception.ts
   ├─ config/app.config.ts
   ├─ database/migrations/.gitkeep
   └─ modules/
      ├─ app/
      │  ├─ app.controller.ts
      │  ├─ app.module.ts
      │  └─ app.service.ts
      └─ health/health.controller.ts`,
};

const generatedResourceTreeCode = `src/modules/users/
├─ users.module.ts
├─ users.controller.ts
├─ users.service.ts
├─ users.repository.ts
├─ users.model.ts
└─ dto/
   ├─ create-users.dto.ts
   └─ update-users.dto.ts

src/database/migrations/
└─ 20260626120000_create_users.sql`;

const workerCode = `import 'reflect-metadata';
import { Module, createApplication, cors, requestLogger } from '@varbyte/nest-worker';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
class AppModule {}

const app = createApplication(AppModule);
app.use(requestLogger({ json: true }));
app.use(cors());

export default app.handler;`;

const controllerCode = `import {
  Body,
  Controller,
  D1,
  Get,
  HttpCode,
  Param,
  Post,
  UsePipe,
  validateBody,
} from '@varbyte/nest-worker';
import type { D1Database } from '@varbyte/nest-worker';
import { UsersService } from './users.service';

interface CreateUserDto {
  name?: string;
  email?: string;
}

const validateCreateUser = validateBody<CreateUserDto>((body) => {
  if (!body?.name) return { field: 'name', message: 'Name is required' };
  if (!body?.email) return { field: 'email', message: 'Email is required' };
});

@Controller('users', [UsersService])
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  findOne(@D1() db: D1Database, @Param('id') id: string) {
    return this.users.findById(db, Number(id));
  }

  @Post()
  @HttpCode(201)
  @UsePipe(validateCreateUser)
  create(@D1() db: D1Database, @Body() body: CreateUserDto) {
    return this.users.create(db, body);
  }
}`;

const validateBodyCode = `import {
  Body,
  Controller,
  Post,
  UsePipe,
  validateBody,
} from '@varbyte/nest-worker';

interface CreateUserDto {
  name?: string;
  email?: string;
}

const validateCreateUser = validateBody<CreateUserDto>((body) => {
  if (!body || typeof body !== 'object') {
    return 'Request body is required';
  }

  const issues = [];
  if (!body.name) {
    issues.push({ field: 'name', message: 'Name is required' });
  }
  if (!body.email?.includes('@')) {
    issues.push({
      field: 'email',
      message: 'Email must be valid',
      code: 'invalid_email',
    });
  }

  return issues;
});

@Controller('users')
export class UsersController {
  @Post()
  @UsePipe(validateCreateUser)
  create(@Body() body: CreateUserDto) {
    return { ok: true, body };
  }
}`;

const createValidationPipeCode = `import {
  Controller,
  Get,
  Param,
  Query,
  UsePipe,
  createValidationPipe,
} from '@varbyte/nest-worker';

const validateUserLookup = createValidationPipe([
  {
    type: 'param',
    key: 'id',
    validate: (id) => {
      if (!Number.isInteger(Number(id))) {
        return { field: 'id', message: 'id must be a number' };
      }
    },
  },
  {
    type: 'query',
    key: 'includePosts',
    validate: (value) => {
      if (value !== undefined && !['true', 'false'].includes(String(value))) {
        return {
          field: 'includePosts',
          message: 'includePosts must be true or false',
        };
      }
    },
  },
]);

@Controller('users')
export class UsersController {
  @Get(':id')
  @UsePipe(validateUserLookup)
  findOne(@Param('id') id: string, @Query('includePosts') includePosts?: string) {
    return { id: Number(id), includePosts: includePosts === 'true' };
  }
}`;

const validationErrorCode = `{
  "statusCode": 400,
  "message": "Validation failed",
  "details": {
    "issues": [
      {
        "field": "email",
        "message": "Email must be valid",
        "code": "invalid_email"
      }
    ]
  }
}`;

const d1Code = `import { D1Repository, Injectable, NotFoundException } from '@varbyte/nest-worker';
import type { D1Database } from '@varbyte/nest-worker';

interface User {
  [key: string]: unknown;
  id: number;
  name: string;
  email: string;
  created_at: string;
}

@Injectable()
export class UsersService {
  private repo(db: D1Database) {
    return new D1Repository<User>(db, 'users');
  }

  async findById(db: D1Database, id: number) {
    const user = await this.repo(db).findById(id);
    if (!user) throw new NotFoundException(\`User #\${id} not found\`);
    return user;
  }

  create(db: D1Database, data: Omit<User, 'id' | 'created_at'>) {
    return this.repo(db).create(data);
  }
}`;

const middlewareCode = `import {
  bearerAuth,
  cors,
  createApplication,
  requestLogger,
} from '@varbyte/nest-worker';

const app = createApplication(AppModule);

app.use(requestLogger({ json: true }));
app.use(cors({
  origin: ['https://app.example.com'],
  credentials: true,
}));
app.use(bearerAuth({ tokenEnvKey: 'API_SECRET' }));`;

const errorFilterCode = `import type { ErrorFilterFn } from '@varbyte/nest-worker';
import { HttpException } from '@varbyte/nest-worker';

export const appErrorFilter: ErrorFilterFn = (error, { request }) => {
  if (!(error instanceof HttpException)) return;

  return Response.json({
    ...error.toJSON(),
    path: new URL(request.url).pathname,
    timestamp: new Date().toISOString(),
  }, { status: error.statusCode });
};

app.useErrorFilter(appErrorFilter);`;

const cliRows = [
  ["new <name>", "Scaffold a new Cloudflare Worker project"],
  ["generate resource <name>", "Create module, controller, service, repository, model, DTOs, and migration"],
  ["generate controller <name>", "Create CRUD route handlers"],
  ["generate service <name>", "Create an injectable service"],
  ["generate provider <name> --type class|value|factory", "Create custom DI providers"],
  ["generate filter <name>", "Create an ErrorFilterFn"],
  ["doctor", "Check project configuration"],
  ["list", "List generated modules and shared resources"],
];

const cliRowsEs = [
  ["new <nombre>", "Crea un proyecto Cloudflare Worker"],
  ["generate resource <nombre>", "Crea módulo, controlador, servicio, repositorio, modelo, DTOs y migración"],
  ["generate controller <nombre>", "Crea rutas CRUD"],
  ["generate service <nombre>", "Crea un servicio inyectable"],
  ["generate provider <nombre> --type class|value|factory", "Crea providers DI personalizados"],
  ["generate filter <nombre>", "Crea un ErrorFilterFn"],
  ["doctor", "Revisa la configuración del proyecto"],
  ["list", "Lista módulos y recursos compartidos generados"],
];

export const content: Record<Lang, LocaleContent> = {
  en: {
    lang: "en",
    label: "English",
    switchLabel: "Español",
    searchPlaceholder: "Search guides, decorators, CLI commands...",
    noResults: "No sections found. Try another term.",
    title: "nest-worker documentation",
    subtitle:
      "Build Cloudflare Workers with a NestJS-inspired programming model, D1 repositories, middleware, validation pipes, and a CLI that generates production-ready project structure.",
    installCommand: "npm install @varbyte/nest-worker reflect-metadata",
    ctaPrimary: "Start with the CLI",
    ctaSecondary: "Browse API reference",
    badges: ["Cloudflare Workers", "D1", "Decorators", "CLI", "TypeScript"],
    sections: [
      {
        id: "getting-started",
        group: "Start",
        title: "Get started",
        description: "Create a working project in under a minute using the official CLI.",
        body: [
          "The CLI is the recommended path for new applications because it creates the Worker entry point, TypeScript config, Wrangler config, error filter, and pnpm build approvals needed by Wrangler dependencies.",
          "After generating a resource, run the Worker locally with Wrangler and start editing the generated module.",
          "Keep generated files close to their module. Treat `src/modules/<feature>` as the feature boundary and keep cross-cutting code in `src/common` or `src/config`.",
        ],
        bullets: [
          "Use Node.js 18 or newer.",
          "Generate resources with the CLI, then edit the DTOs, model, migration, and service logic.",
          "Keep validation at the controller boundary with `@UsePipe()`.",
          "Use `requestLogger({ json: true })` and a global error filter before publishing an API.",
          "Use `doctor` when a project does not compile, install, or deploy.",
        ],
        code: [
          { label: "Terminal", language: "bash", code: quickStartCode.en },
          { label: "Project generated by `nest-worker new`", language: "text", code: generatedTreeCode.en },
          { label: "Files generated by `nest-worker generate resource users`", language: "text", code: generatedResourceTreeCode },
        ],
      },
      {
        id: "application",
        group: "Core",
        title: "Application setup",
        description: "Create an application from a root module and register global middleware.",
        body: [
          "`createApplication()` turns a module into a Cloudflare Worker fetch handler.",
          "Register middleware before exporting `app.handler`. Middleware runs before route handlers and can short-circuit requests by returning a Response.",
        ],
        code: [{ label: "src/worker.ts", language: "ts", code: workerCode }],
      },
      {
        id: "controllers",
        group: "Core",
        title: "Controllers and routes",
        description: "Use decorators to map class methods to HTTP routes and request data.",
        body: [
          "Controllers define route groups. Method decorators such as `@Get`, `@Post`, `@Put`, and `@Delete` define route handlers.",
          "Parameter decorators read request data: `@Body`, `@Param`, `@Query`, `@Headers`, `@Req`, `@Env`, and `@D1`.",
        ],
        code: [{ label: "users.controller.ts", language: "ts", code: controllerCode }],
      },
      {
        id: "modules-di",
        group: "Core",
        title: "Modules and dependency injection",
        description: "Group controllers and providers using Nest-style modules.",
        body: [
          "Use `@Module()` to declare controllers, providers, imports, and exports. Providers can be classes or custom provider objects.",
          "Use constructor injection for services. Use `@Inject()` when injecting a custom token.",
        ],
        bullets: [
          "`controllers` are route entry points.",
          "`providers` are injectable services or provider definitions.",
          "`imports` bring exported providers from other modules.",
          "`exports` define what another module can consume.",
        ],
      },
      {
        id: "d1",
        group: "Data",
        title: "D1 repositories",
        description: "Use D1Repository and QueryBuilder for safe database access.",
        body: [
          "`D1Repository` gives you common CRUD methods. Identifiers are sanitized and values use parameterized bindings.",
          "For custom SQL, use `raw()` or `rawFirst()` with placeholders.",
        ],
        code: [{ label: "users.service.ts", language: "ts", code: d1Code }],
      },
      {
        id: "validation",
        group: "Runtime",
        title: "Validation pipes",
        description: "Validate request data before the handler runs.",
        body: [
          "Use `validateBody()` for the common case. Use `createValidationPipe()` when you need to validate body, params, query, headers, or env values.",
          "Validators can return nothing, `true`, `false`, a string, one issue, or a list of issues.",
          "When validation fails, the framework throws `BadRequestException` with a stable list of issues that can be normalized by your global error filter.",
        ],
        bullets: [
          "Validate at the edge of the app, before calling services.",
          "Return structured issues when clients need field-level errors.",
          "Keep business rules in services; keep request shape checks in pipes.",
        ],
        code: [
          { label: "validateBody() for JSON body validation", language: "ts", code: validateBodyCode },
          { label: "createValidationPipe() for params and query", language: "ts", code: createValidationPipeCode },
          { label: "Validation error shape", language: "json", code: validationErrorCode },
        ],
      },
      {
        id: "middleware",
        group: "Runtime",
        title: "Middleware",
        description: "Compose CORS, logging, auth, and development rate limiting.",
        body: [
          "`requestLogger()` produces request ids, durations, status codes, and optional JSON logs.",
          "`devRateLimit()` is intentionally in-memory and is not production-safe across Cloudflare isolates. Use Durable Objects, KV with tradeoffs, or Cloudflare platform controls for production rate limiting.",
        ],
        code: [{ label: "src/worker.ts", language: "ts", code: middlewareCode }],
      },
      {
        id: "errors",
        group: "Runtime",
        title: "Errors and filters",
        description: "Throw HttpException subclasses and normalize error responses with filters.",
        body: [
          "Use built-in exceptions such as `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, and `InternalServerErrorException`.",
          "Register global filters with `app.useErrorFilter()` when your API needs a stable error envelope.",
        ],
        code: [{ label: "app-error.filter.ts", language: "ts", code: errorFilterCode }],
      },
      {
        id: "cli",
        group: "Tools",
        title: "CLI reference",
        description: "Generate project files that match the current runtime APIs.",
        body: [
          "The CLI is published as `@varbyte/nest-worker-cli` and exposes the `nest-worker` command.",
          "Generated projects include configuration for GitHub-friendly source control, TypeScript, Wrangler, pnpm, error filters, and health checks.",
        ],
        table: {
          columns: ["Command", "What it does"],
          rows: cliRows,
        },
      },
      {
        id: "deploy",
        group: "Deploy",
        title: "Deploy to Cloudflare",
        description: "Use Wrangler once your Worker and D1 bindings are configured.",
        body: [
          "Set `main`, `compatibility_date`, and `compatibility_flags` in `wrangler.toml`.",
          "If you use D1, uncomment the `[[d1_databases]]` block and set the real `database_id` from Cloudflare.",
        ],
        code: [
          {
            label: "wrangler.toml",
            language: "toml",
            code: `name = "my-api"
main = "src/worker.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "my-api-db"
database_id = "YOUR_DATABASE_ID"`,
          },
        ],
      },
    ],
  },
  es: {
    lang: "es",
    label: "Español",
    switchLabel: "English",
    searchPlaceholder: "Buscar guías, decoradores, comandos CLI...",
    noResults: "No se encontraron secciones. Prueba otro término.",
    title: "Documentación de nest-worker",
    subtitle:
      "Construye Cloudflare Workers con un modelo inspirado en NestJS, repositorios D1, middleware, pipes de validación y una CLI que genera estructura lista para producción.",
    installCommand: "npm install @varbyte/nest-worker reflect-metadata",
    ctaPrimary: "Empezar con la CLI",
    ctaSecondary: "Ver referencia API",
    badges: ["Cloudflare Workers", "D1", "Decoradores", "CLI", "TypeScript"],
    sections: [
      {
        id: "getting-started",
        group: "Inicio",
        title: "Inicio rápido",
        description: "Crea un proyecto funcional en menos de un minuto usando la CLI oficial.",
        body: [
          "La CLI es la ruta recomendada para aplicaciones nuevas porque crea el entry point del Worker, configuración TypeScript, configuración Wrangler, filtro de errores y aprobaciones de build de pnpm necesarias para dependencias de Wrangler.",
          "Después de generar un recurso, ejecuta el Worker localmente con Wrangler y empieza a editar el módulo generado.",
          "Mantén los archivos generados cerca de su módulo. Trata `src/modules/<feature>` como el límite de la feature y deja código transversal en `src/common` o `src/config`.",
        ],
        bullets: [
          "Usa Node.js 18 o superior.",
          "Genera recursos con la CLI y luego edita DTOs, modelo, migración y lógica del servicio.",
          "Mantén la validación en el borde del controlador con `@UsePipe()`.",
          "Usa `requestLogger({ json: true })` y un filtro global de errores antes de publicar una API.",
          "Usa `doctor` cuando un proyecto no compile, no instale o no despliegue.",
        ],
        code: [
          { label: "Terminal", language: "bash", code: quickStartCode.es },
          { label: "Proyecto generado por `nest-worker new`", language: "text", code: generatedTreeCode.es },
          { label: "Archivos generados por `nest-worker generate resource users`", language: "text", code: generatedResourceTreeCode },
        ],
      },
      {
        id: "application",
        group: "Core",
        title: "Configuración de aplicación",
        description: "Crea una aplicación desde un módulo raíz y registra middleware global.",
        body: [
          "`createApplication()` convierte un módulo en un fetch handler de Cloudflare Workers.",
          "Registra middleware antes de exportar `app.handler`. El middleware corre antes de los handlers y puede cortar la request devolviendo un Response.",
        ],
        code: [{ label: "src/worker.ts", language: "ts", code: workerCode }],
      },
      {
        id: "controllers",
        group: "Core",
        title: "Controladores y rutas",
        description: "Usa decoradores para mapear métodos de clase a rutas HTTP y datos del request.",
        body: [
          "Los controladores definen grupos de rutas. Decoradores como `@Get`, `@Post`, `@Put` y `@Delete` definen handlers.",
          "Los decoradores de parámetros leen datos del request: `@Body`, `@Param`, `@Query`, `@Headers`, `@Req`, `@Env` y `@D1`.",
        ],
        code: [{ label: "users.controller.ts", language: "ts", code: controllerCode }],
      },
      {
        id: "modules-di",
        group: "Core",
        title: "Módulos e inyección de dependencias",
        description: "Agrupa controladores y providers usando módulos estilo Nest.",
        body: [
          "Usa `@Module()` para declarar controllers, providers, imports y exports. Los providers pueden ser clases u objetos provider personalizados.",
          "Usa inyección por constructor para servicios. Usa `@Inject()` cuando necesites inyectar un token personalizado.",
        ],
        bullets: [
          "`controllers` son puntos de entrada HTTP.",
          "`providers` son servicios o definiciones inyectables.",
          "`imports` traen providers exportados por otros módulos.",
          "`exports` define qué puede consumir otro módulo.",
        ],
      },
      {
        id: "d1",
        group: "Datos",
        title: "Repositorios D1",
        description: "Usa D1Repository y QueryBuilder para acceder a datos de forma segura.",
        body: [
          "`D1Repository` te da métodos CRUD comunes. Los identificadores se sanitizan y los valores usan bindings parametrizados.",
          "Para SQL personalizado, usa `raw()` o `rawFirst()` con placeholders.",
        ],
        code: [{ label: "users.service.ts", language: "ts", code: d1Code }],
      },
      {
        id: "validation",
        group: "Runtime",
        title: "Pipes de validación",
        description: "Valida datos del request antes de ejecutar el handler.",
        body: [
          "Usa `validateBody()` para el caso común. Usa `createValidationPipe()` cuando necesites validar body, params, query, headers o env.",
          "Los validadores pueden devolver nada, `true`, `false`, un string, un issue o una lista de issues.",
          "Cuando la validación falla, el framework lanza `BadRequestException` con una lista estable de issues que puedes normalizar con tu filtro global de errores.",
        ],
        bullets: [
          "Valida en el borde de la app, antes de llamar servicios.",
          "Devuelve issues estructurados cuando el cliente necesita errores por campo.",
          "Deja reglas de negocio en servicios; deja validaciones de forma del request en pipes.",
        ],
        code: [
          { label: "validateBody() para validar JSON body", language: "ts", code: validateBodyCode },
          { label: "createValidationPipe() para params y query", language: "ts", code: createValidationPipeCode },
          { label: "Forma del error de validación", language: "json", code: validationErrorCode },
        ],
      },
      {
        id: "middleware",
        group: "Runtime",
        title: "Middleware",
        description: "Compón CORS, logging, auth y rate limiting de desarrollo.",
        body: [
          "`requestLogger()` produce request ids, duración, status codes y logs JSON opcionales.",
          "`devRateLimit()` usa memoria local y no es seguro para producción entre isolates de Cloudflare. Para producción usa Durable Objects, KV con tradeoffs o controles de la plataforma Cloudflare.",
        ],
        code: [{ label: "src/worker.ts", language: "ts", code: middlewareCode }],
      },
      {
        id: "errors",
        group: "Runtime",
        title: "Errores y filtros",
        description: "Lanza HttpException y normaliza respuestas de error con filtros.",
        body: [
          "Usa excepciones integradas como `BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException` e `InternalServerErrorException`.",
          "Registra filtros globales con `app.useErrorFilter()` cuando tu API necesite un envelope estable de errores.",
        ],
        code: [{ label: "app-error.filter.ts", language: "ts", code: errorFilterCode }],
      },
      {
        id: "cli",
        group: "Herramientas",
        title: "Referencia CLI",
        description: "Genera archivos de proyecto alineados con las APIs actuales del runtime.",
        body: [
          "La CLI se publica como `@varbyte/nest-worker-cli` y expone el comando `nest-worker`.",
          "Los proyectos generados incluyen configuración para GitHub, TypeScript, Wrangler, pnpm, filtros de error y health checks.",
        ],
        table: {
          columns: ["Comando", "Qué hace"],
          rows: cliRowsEs,
        },
      },
      {
        id: "deploy",
        group: "Deploy",
        title: "Deploy a Cloudflare",
        description: "Usa Wrangler cuando tu Worker y bindings D1 estén configurados.",
        body: [
          "Define `main`, `compatibility_date` y `compatibility_flags` en `wrangler.toml`.",
          "Si usas D1, descomenta el bloque `[[d1_databases]]` y configura el `database_id` real desde Cloudflare.",
        ],
        code: [
          {
            label: "wrangler.toml",
            language: "toml",
            code: `name = "mi-api"
main = "src/worker.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "mi-api-db"
database_id = "YOUR_DATABASE_ID"`,
          },
        ],
      },
    ],
  },
};
