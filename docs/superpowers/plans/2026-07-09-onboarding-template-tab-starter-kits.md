# Onboarding Template Tab Starter Kits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing onboarding Step 3 `Use a template` tab into the starter-kit creation path for React, Next.js, Node.js, and NestJS without adding a plan selector.

**Architecture:** The central `cicd-workflow` repo remains the catalog source. The backend exposes starter kits through the existing catalog/project creation contracts, creates new repositories from GitHub template repositories when `sourceType` is `starter-kit`, then applies the plan-allowed workflow setup. The frontend reuses the current Step 3 tab UI: `Import a repository` keeps the repository picker, and `Use a template` shows the starter-kit picker plus repository settings.

**Tech Stack:** Next.js/React frontend, NestJS backend, GitHub REST API, existing catalog JSON in `cicd-workflow`, Jest unit tests.

---

## File Structure

Central workflow repo:

- `catalog/starter-kits.json` already exists and remains the source for starter-kit metadata.

Frontend repo `cicd-workflow-fe`:

- Modify `src/lib/api/contracts.ts` to add starter-kit and source-type contracts.
- Modify `src/hooks/use-create-project-form.ts` so create-project payloads can include `sourceType` and `starterKitId` while never including `plan`.
- Modify `src/features/dashboard/onboarding/onboarding-page.tsx` to make the existing `Use a template` tab interactive.
- Modify `tests/unit/onboarding-page.test.tsx` for the Step 3 tab behavior.
- Modify `tests/unit/workflow-hooks.test.tsx` for payload construction.

Backend repo `cicd-workflow-be`:

- Modify `src/modules/catalog/catalog.service.ts` to load `catalog/starter-kits.json` into `project-options`.
- Modify `src/modules/catalog/catalog.service.spec.ts` to cover starter-kit catalog loading and fallback.
- Modify `src/modules/projects/dto/create-project.dto.ts` to accept `sourceType` and `starterKitId`, but not `plan`.
- Modify `src/modules/github/github.service.ts` to create a repository from a GitHub template repository.
- Modify `src/modules/github/github.service.spec.ts` for the template repository API call.
- Modify `src/modules/projects/projects.service.ts` so starter-kit creation uses the GitHub template path and stores source metadata in `projectOptions`.
- Modify `src/modules/projects/projects.service.spec.ts` to prove starter-kit creation skips backend scaffold generation and applies checks-only setup for starter projects.

## Product Constraints

- Do not add a plan selector to onboarding or create-project payloads.
- Do not expose internal hosting/provider/runtime copy in customer-facing labels.
- Existing repo setup remains PR-based.
- New starter-kit repo setup can be direct because the repository starts empty of user-owned code.
- Phase 1 implementation target is React + Solo behavior first, with catalog support for all four kits.

## Task 1: Backend Catalog Starter-Kit Contract

**Files:**

- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\catalog\catalog.service.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\catalog\catalog.service.spec.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\src\lib\api\contracts.ts`

- [ ] **Step 1: Write the failing backend catalog test**

Add this test inside `describe('getProjectOptions', ...)` in `src/modules/catalog/catalog.service.spec.ts`:

```ts
it('loads starter kits from the engine catalog', () => {
  mockSyncFs.readFileSync.mockImplementation((path) => {
    const normalized = String(path).replaceAll('\\', '/');
    if (normalized.endsWith('/catalog/stacks.json')) {
      return JSON.stringify([
        {
          key: 'react-spa',
          label: 'React SPA',
          kind: 'frontend',
          runtime: 'node',
          serviceWorkflow: 'reactService',
        },
      ]);
    }
    if (normalized.endsWith('/catalog/workflow-refs.json')) {
      return JSON.stringify({
        currentStable: 'v1',
        repository: 'cicd-external-project/cicd-workflow',
        workflows: {
          reactService: '.github/workflows/service-react.yml',
        },
      });
    }
    if (normalized.endsWith('/catalog/starter-kits.json')) {
      return JSON.stringify({
        schemaVersion: 1,
        starterKits: [
          {
            id: 'react-starter-kit',
            label: 'React Starter Kit',
            description: 'A clean React starter.',
            repo: 'Alpha-Explora/alphaexplora-react-starter-kit',
            projectType: 'react-spa',
            repoShape: 'single-app',
            language: 'typescript',
            framework: 'react',
            defaultWorkingDirectory: '.',
            workflowTiming: 'after-template',
            containsWorkflows: false,
            defaultRecipesByPlan: {
              solo: 'frontend-checks',
              plus: 'frontend-code-quality',
              pro: 'frontend-release',
            },
          },
        ],
      });
    }
    if (
      normalized.endsWith('/catalog/actions.json') ||
      normalized.endsWith('/catalog/providers.json') ||
      normalized.endsWith('/catalog/plans.json')
    ) {
      return '[]';
    }
    throw new Error(`Unexpected catalog read: ${normalized}`);
  });

  const result = service.getProjectOptions();

  expect(result.starterKits).toEqual([
    expect.objectContaining({
      id: 'react-starter-kit',
      label: 'React Starter Kit',
      repo: 'Alpha-Explora/alphaexplora-react-starter-kit',
      projectType: 'react-spa',
      containsWorkflows: false,
    }),
  ]);
});
```

- [ ] **Step 2: Run the failing backend catalog test**

Run:

```powershell
npm test -- catalog.service.spec.ts
```

Expected: FAIL because `ProjectOptionsResult` does not expose `starterKits`.

- [ ] **Step 3: Add catalog types and loading**

In `src/modules/catalog/catalog.service.ts`, add:

```ts
export interface StarterKitOption {
  id: string;
  label: string;
  description: string;
  repo: string;
  projectType: string;
  repoShape: string;
  language: string;
  framework: string;
  defaultWorkingDirectory: string;
  workflowTiming: 'after-template';
  containsWorkflows: boolean;
  defaultRecipesByPlan: Record<'solo' | 'plus' | 'pro', string>;
}
```

Extend `ProjectOptionsResult`:

```ts
export interface ProjectOptionsResult {
  repoShapes: RepoShapeOption[];
  projectTypes: ProjectTypeOption[];
  recipes: WorkflowRecipeOption[];
  nodeVersions: NodeVersionOption[];
  starterKits: StarterKitOption[];
}
```

Add `starterKits: []` to `STATIC_PROJECT_OPTIONS`.

In `loadEngineProjectOptions()`, read the file:

```ts
const starterKitFile = this.readCatalogJson<{
  starterKits?: StarterKitOption[];
}>(catalogRoot, 'starter-kits.json');
const starterKits = Array.isArray(starterKitFile.starterKits)
  ? starterKitFile.starterKits.filter((kit): kit is StarterKitOption =>
      typeof kit.id === 'string' &&
      typeof kit.label === 'string' &&
      typeof kit.repo === 'string' &&
      typeof kit.projectType === 'string' &&
      kit.workflowTiming === 'after-template' &&
      kit.containsWorkflows === false,
    )
  : [];
```

Return `starterKits` in the result.

- [ ] **Step 4: Update frontend contracts**

In `src/lib/api/contracts.ts`, add:

```ts
export interface StarterKitOption {
  id: string;
  label: string;
  description: string;
  repo: string;
  projectType: string;
  repoShape: string;
  language: string;
  framework: string;
  defaultWorkingDirectory: string;
  workflowTiming: 'after-template';
  containsWorkflows: false;
  defaultRecipesByPlan: Record<'solo' | 'plus' | 'pro', string>;
}
```

Extend `ProjectOptionsResponse`:

```ts
export interface ProjectOptionsResponse {
  repoShapes: RepoShapeOption[];
  projectTypes: ProjectTypeOption[];
  recipes: WorkflowRecipeOption[];
  nodeVersions: NodeVersionOption[];
  starterKits: StarterKitOption[];
}
```

- [ ] **Step 5: Run focused catalog tests**

Run:

```powershell
npm test -- catalog.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/modules/catalog/catalog.service.ts src/modules/catalog/catalog.service.spec.ts
git commit -m "Add starter kit catalog options"
```

Do the frontend contract commit separately:

```powershell
git add src/lib/api/contracts.ts
git commit -m "Add starter kit frontend contracts"
```

## Task 2: Backend Starter-Kit Repository Creation

**Files:**

- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\projects\dto\create-project.dto.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\github\github.service.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\github\github.service.spec.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\projects\projects.service.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-be\src\modules\projects\projects.service.spec.ts`

- [ ] **Step 1: Write failing DTO/service tests**

In `src/modules/projects/projects.service.spec.ts`, add:

```ts
it('creates starter kit projects from the selected template repository', async () => {
  const catalogService = makeCatalogService() as jest.Mocked<CatalogService>;
  catalogService.getProjectOptions.mockReturnValue({
    ...catalogService.getProjectOptions(),
    starterKits: [
      {
        id: 'react-starter-kit',
        label: 'React Starter Kit',
        description: 'A clean React starter.',
        repo: 'Alpha-Explora/alphaexplora-react-starter-kit',
        projectType: 'react-spa',
        repoShape: 'single-app',
        language: 'typescript',
        framework: 'react',
        defaultWorkingDirectory: '.',
        workflowTiming: 'after-template',
        containsWorkflows: false,
        defaultRecipesByPlan: {
          solo: 'frontend-standard-ci',
          plus: 'frontend-standard-ci',
          pro: 'frontend-standard-ci',
        },
      },
    ],
  } as never);
  const githubWithTemplate = {
    ...makeGithubService(),
    createRepoFromTemplate: jest.fn().mockResolvedValue({
      repoUrl: 'https://github.com/tone/customer-web',
      cloneUrl: 'https://github.com/tone/customer-web.git',
      ownerLogin: 'tone',
      repoName: 'customer-web',
    }),
  } as never;
  const starterService = new ProjectsService(
    catalogService,
    githubWithTemplate,
    makeProjectsRepository(),
    makeCiService(),
    projectDeploymentProvisioningService as never,
  );
  const pushStarterFilesSpy = jest.spyOn(starterService as never, 'pushStarterFiles');
  const pushWorkflowFileSpy = jest
    .spyOn(starterService as never, 'pushWorkflowFile')
    .mockResolvedValue({
      commitSha: 'commit-sha',
      commitUrl: 'https://github.com/tone/customer-web/commit/commit-sha',
    });

  await starterService.createProject('user-1', 'tone', 'oauth-token', {
    sourceType: 'starter-kit',
    starterKitId: 'react-starter-kit',
    repoName: 'customer-web',
    visibility: 'private',
    repoShape: 'single-app',
    projectTypeId: 'react-spa',
    workflowRecipeId: 'frontend-standard-ci',
    serviceName: 'customer-web',
    servicePath: '.',
    nodeVersion: '24',
    coverageThreshold: 80,
    tests: {
      lint: true,
      unit: true,
      build: true,
      coverage: true,
      security: true,
      docker: false,
    },
  });

  expect(githubWithTemplate.createRepoFromTemplate).toHaveBeenCalledWith(
    'app-token',
    {
      templateOwner: 'Alpha-Explora',
      templateRepo: 'alphaexplora-react-starter-kit',
      repoName: 'customer-web',
      private: true,
    },
  );
  expect(pushStarterFilesSpy).not.toHaveBeenCalled();
  expect(pushWorkflowFileSpy).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the failing projects test**

Run:

```powershell
npm test -- projects.service.spec.ts --runInBand
```

Expected: FAIL because `sourceType`, `starterKitId`, and `createRepoFromTemplate` do not exist.

- [ ] **Step 3: Extend CreateProjectDto**

In `src/modules/projects/dto/create-project.dto.ts`, add to `CreateProjectDto`:

```ts
@IsOptional()
@IsIn(['scaffold', 'starter-kit'])
sourceType?: 'scaffold' | 'starter-kit';

@IsOptional()
@IsString()
@MaxLength(120)
starterKitId?: string;
```

Do not add a `plan` field.

- [ ] **Step 4: Add GitHub template creation API**

In `src/modules/github/github.service.ts`, add:

```ts
async createRepoFromTemplate(
  accessToken: string,
  input: {
    templateOwner: string;
    templateRepo: string;
    repoName: string;
    private: boolean;
    description?: string;
  },
): Promise<{
  repoUrl: string;
  cloneUrl: string;
  ownerLogin: string;
  repoName: string;
}> {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(input.templateOwner)}/${encodeURIComponent(input.templateRepo)}/generate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'cicd-workflow-product',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: input.repoName,
        private: input.private,
        include_all_branches: false,
        ...(input.description ? { description: input.description } : {}),
      }),
    },
  );

  const body = await response.json().catch(() => null) as {
    html_url?: string;
    clone_url?: string;
    owner?: { login?: string };
    name?: string;
    message?: string;
  } | null;

  if (!response.ok || !body?.html_url || !body.owner?.login || !body.name) {
    throw new UnprocessableEntityException(
      `Repository could not be created from template: ${body?.message ?? response.statusText}`,
    );
  }

  return {
    repoUrl: body.html_url,
    cloneUrl: body.clone_url ?? body.html_url,
    ownerLogin: body.owner.login,
    repoName: body.name,
  };
}
```

Add the matching `fetch` mock assertion to `src/modules/github/github.service.spec.ts`.

- [ ] **Step 5: Route starter-kit projects in ProjectsService**

In `src/modules/projects/projects.service.ts`, add helper methods:

```ts
private resolveStarterKit(starterKitId: string | undefined) {
  if (!starterKitId) {
    throw new UnprocessableEntityException('Starter kit is required.');
  }

  const starterKit = this.catalogService
    .getProjectOptions()
    .starterKits.find((kit) => kit.id === starterKitId);

  if (!starterKit) {
    throw new NotFoundException('Starter kit is not available.');
  }

  const [templateOwner, templateRepo] = starterKit.repo.split('/');
  if (!templateOwner || !templateRepo) {
    throw new UnprocessableEntityException('Starter kit repository is invalid.');
  }

  return { starterKit, templateOwner, templateRepo };
}
```

In the single-repo path of `createProject()`, replace only the repository creation/scaffold block with:

```ts
const sourceType = dto.sourceType ?? 'scaffold';
const starterKitContext =
  sourceType === 'starter-kit'
    ? this.resolveStarterKit(dto.starterKitId)
    : null;

const createdRepo = starterKitContext
  ? await this.githubService.createRepoFromTemplate(provisioningToken, {
      templateOwner: starterKitContext.templateOwner,
      templateRepo: starterKitContext.templateRepo,
      repoName: dto.repoName,
      private: dto.visibility === 'private',
    })
  : await this.githubService.createRepo(provisioningToken, {
      repoName: dto.repoName,
      private: dto.visibility === 'private',
    });

const { repoUrl, ownerLogin, repoName } = createdRepo;
const repoFullName = `${ownerLogin}/${repoName}`;

if (!starterKitContext) {
  await this.pushStarterFiles(provisioningToken, ownerLogin, repoName, {
    projectName: dto.serviceName,
    stack: dto.projectTypeId,
    repoShape,
    ...(dto.tests?.['docker'] !== undefined && {
      includeDocker: dto.tests['docker'],
    }),
  });
}
```

When persisting `projectOptions`, include:

```ts
sourceType,
...(starterKitContext
  ? {
      starterKitId: starterKitContext.starterKit.id,
      starterKitRepo: starterKitContext.starterKit.repo,
    }
  : {}),
```

- [ ] **Step 6: Run backend focused tests**

Run:

```powershell
npm test -- github.service.spec.ts projects.service.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/modules/projects/dto/create-project.dto.ts src/modules/github/github.service.ts src/modules/github/github.service.spec.ts src/modules/projects/projects.service.ts src/modules/projects/projects.service.spec.ts
git commit -m "Create projects from starter kit repositories"
```

## Task 3: Frontend Create-Project Payload Support

**Files:**

- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\src\lib\api\contracts.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\src\hooks\use-create-project-form.ts`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\tests\unit\workflow-hooks.test.tsx`

- [ ] **Step 1: Write failing hook test**

In `tests/unit/workflow-hooks.test.tsx`, add to the create-project payload test:

```ts
const starterResult = current?.buildPayload({
  sourceType: 'starter-kit',
  starterKitId: 'react-starter-kit',
  isMicroservicesShape: false,
  isMultiRepoShape: false,
  repoShapeId: 'single-app',
  projectTypeId: 'react-spa',
  workflowRecipeId: 'frontend-standard-ci',
  tests: {
    lint: true,
    unit: true,
    build: true,
    coverage: true,
    security: true,
    docker: false,
  },
});

expect(starterResult).toEqual({
  ok: true,
  payload: expect.objectContaining({
    sourceType: 'starter-kit',
    starterKitId: 'react-starter-kit',
  }),
});
expect(JSON.stringify(starterResult)).not.toContain('"plan"');
```

- [ ] **Step 2: Run the failing frontend hook test**

Run:

```powershell
npm test -- tests/unit/workflow-hooks.test.tsx
```

Expected: FAIL because `BuildPayloadInput` does not accept `sourceType` and `starterKitId`.

- [ ] **Step 3: Extend frontend request contract**

In `src/lib/api/contracts.ts`, extend `CreateProjectRequest`:

```ts
sourceType?: 'scaffold' | 'starter-kit';
starterKitId?: string;
```

- [ ] **Step 4: Extend buildPayload input and output**

In `src/hooks/use-create-project-form.ts`, add to `BuildPayloadInput`:

```ts
sourceType?: CreateProjectRequest['sourceType'];
starterKitId?: string;
```

In the single-app payload return, add:

```ts
...(input.sourceType ? { sourceType: input.sourceType } : {}),
...(input.starterKitId ? { starterKitId: input.starterKitId } : {}),
```

Do not add `plan` anywhere.

- [ ] **Step 5: Run the hook test**

Run:

```powershell
npm test -- tests/unit/workflow-hooks.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/api/contracts.ts src/hooks/use-create-project-form.ts tests/unit/workflow-hooks.test.tsx
git commit -m "Add starter kit create project payload"
```

## Task 4: Onboarding Step 3 Template Tab UI

**Files:**

- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\src\features\dashboard\onboarding\onboarding-page.tsx`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\tests\unit\onboarding-page.test.tsx`

- [ ] **Step 1: Write failing onboarding tab test**

In `tests/unit/onboarding-page.test.tsx`, extend the callback test after Step 3 appears:

```ts
click(result.container.querySelector("button[data-template-tab='use-template']"));

expect(result.container).toHaveTextContent("React Starter Kit");
expect(result.container).toHaveTextContent("Next.js Starter Kit");
expect(result.container).toHaveTextContent("Node.js Starter Kit");
expect(result.container).toHaveTextContent("NestJS Starter Kit");
expect(result.container).not.toHaveTextContent("Choose your plan");

click(result.container.querySelector("button[data-starter-kit='react-starter-kit']"));

expect(result.container.querySelector("[data-onboarding-step='create-application']")).not.toBeNull();
expect(result.container).toHaveTextContent("React Starter Kit");
```

- [ ] **Step 2: Run the failing onboarding test**

Run:

```powershell
npm test -- tests/unit/onboarding-page.test.tsx
```

Expected: FAIL because the `Use a template` tab is inert.

- [ ] **Step 3: Add local starter-kit view model**

In `src/features/dashboard/onboarding/onboarding-page.tsx`, add:

```ts
type StarterKit = {
  id: string;
  label: string;
  description: string;
  projectTypeId: string;
};

const starterKits: StarterKit[] = [
  {
    id: 'react-starter-kit',
    label: 'React Starter Kit',
    description: 'React and TypeScript application foundation.',
    projectTypeId: 'react-spa',
  },
  {
    id: 'nextjs-starter-kit',
    label: 'Next.js Starter Kit',
    description: 'Next.js and TypeScript application foundation.',
    projectTypeId: 'nextjs-app',
  },
  {
    id: 'nodejs-starter-kit',
    label: 'Node.js Starter Kit',
    description: 'Node.js API foundation.',
    projectTypeId: 'nodejs-api',
  },
  {
    id: 'nestjs-starter-kit',
    label: 'NestJS Starter Kit',
    description: 'NestJS and TypeScript API foundation.',
    projectTypeId: 'nestjs-api',
  },
];
```

This is a Phase 1 bridge. A follow-up task can replace it with `getProjectOptions().starterKits` once the full create-project submit is wired.

- [ ] **Step 4: Add tab state**

Add:

```ts
type RepositorySelectionTab = 'import' | 'template';
```

Update `RepositorySelectionStep` props:

```ts
function RepositorySelectionStep({
  activeTab,
  creditLine,
  onSelectRepository,
  onSelectStarterKit,
  onSetActiveTab,
}: Readonly<{
  activeTab: RepositorySelectionTab;
  creditLine: string;
  onSelectRepository: (repository: Repository) => void;
  onSelectStarterKit: (starterKit: StarterKit) => void;
  onSetActiveTab: (tab: RepositorySelectionTab) => void;
}>) {
```

Render tab buttons with data attributes:

```tsx
<button
  className={cn(
    "min-h-8 border-0 border-b-2 bg-transparent pb-3 text-sm font-bold",
    activeTab === "import"
      ? "border-foreground text-foreground"
      : "border-transparent text-muted-foreground",
  )}
  data-template-tab="import-repository"
  onClick={() => onSetActiveTab("import")}
  type="button"
>
  Import a repository
</button>
<button
  className={cn(
    "min-h-8 border-0 border-b-2 bg-transparent pb-3 text-sm font-bold",
    activeTab === "template"
      ? "border-foreground text-foreground"
      : "border-transparent text-muted-foreground",
  )}
  data-template-tab="use-template"
  onClick={() => onSetActiveTab("template")}
  type="button"
>
  Use a template
</button>
```

Keep the existing repository picker under `activeTab === "import"`. Add starter cards under `activeTab === "template"`:

```tsx
{activeTab === "template" ? (
  <Card className="grid gap-2 p-2">
    {starterKits.map((starterKit) => (
      <button
        className="grid gap-1 rounded-md bg-transparent px-3 py-3 text-left text-sm text-foreground hover:bg-muted"
        data-starter-kit={starterKit.id}
        key={starterKit.id}
        onClick={() => onSelectStarterKit(starterKit)}
        type="button"
      >
        <strong>{starterKit.label}</strong>
        <span className="text-muted-foreground">{starterKit.description}</span>
      </button>
    ))}
  </Card>
) : null}
```

- [ ] **Step 5: Track selected starter kit in onboarding**

In `OnboardingContent`, add:

```ts
const [repositorySelectionTab, setRepositorySelectionTab] =
  useState<RepositorySelectionTab>("import");
const [selectedStarterKit, setSelectedStarterKit] =
  useState<StarterKit | null>(null);
```

Add:

```ts
function handleSelectStarterKit(starterKit: StarterKit) {
  setSelectedStarterKit(starterKit);
  setSelectedRepository({
    name: starterKit.id.replace("-starter-kit", ""),
    updated: starterKit.label,
  });
  setCurrentStep("create-application");
}
```

Thread props through `ActiveStep`.

- [ ] **Step 6: Show starter kit in Step 4**

Update `CreateApplicationStep` props:

```ts
function CreateApplicationStep({
  creditLine,
  repository,
  starterKit,
}: Readonly<{
  creditLine: string;
  repository: Repository;
  starterKit: StarterKit | null;
}>) {
```

Replace the clone line:

```tsx
<span className="text-sm text-muted-foreground">
  {starterKit
    ? `Creating from ${starterKit.label}`
    : `Cloning from antoneeeems/${repository.name}`}
</span>
```

- [ ] **Step 7: Run onboarding test**

Run:

```powershell
npm test -- tests/unit/onboarding-page.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/features/dashboard/onboarding/onboarding-page.tsx tests/unit/onboarding-page.test.tsx
git commit -m "Enable onboarding template tab"
```

## Task 5: Wire Template Tab To Project Creation

**Files:**

- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\src\features\dashboard\onboarding\onboarding-page.tsx`
- Modify: `C:\Codes\cicd-ex\cicd-workflow-fe\tests\unit\onboarding-page.test.tsx`

- [ ] **Step 1: Write failing submit test**

Mock `createProject` in `tests/unit/onboarding-page.test.tsx`:

```ts
import { createProject } from "../../src/lib/api/projects";

jest.mock("../../src/lib/api/projects", () => ({
  createProject: jest.fn(),
}));
```

Set default:

```ts
const mockedCreateProject = jest.mocked(createProject);
mockedCreateProject.mockResolvedValue({
  id: "project-1",
  repoFullName: "antoneeeems/react",
  repoUrl: "https://github.com/antoneeeems/react",
  status: "provisioned",
  workflowPath: ".github/workflows/00-flowci-access.yml",
  workflowFiles: [],
  githubCommitSha: "commit-sha",
  githubCommitUrl: null,
  projectTypeId: "react-spa",
  workflowRecipeId: "frontend-standard-ci",
});
```

Add assertion:

```ts
click(result.container.querySelector("button[data-template-tab='use-template']"));
click(result.container.querySelector("button[data-starter-kit='react-starter-kit']"));
click(result.container.querySelector("button[data-action='create-application']"));

await flushAsyncEffects();

expect(mockedCreateProject).toHaveBeenCalledWith(
  expect.objectContaining({
    sourceType: "starter-kit",
    starterKitId: "react-starter-kit",
    repoName: "react",
    visibility: "private",
    repoShape: "single-app",
    projectTypeId: "react-spa",
    workflowRecipeId: "frontend-standard-ci",
  }),
);
expect(JSON.stringify(mockedCreateProject.mock.calls[0]?.[0])).not.toContain('"plan"');
expect(result.container).toHaveTextContent("Project created");
```

- [ ] **Step 2: Run the failing submit test**

Run:

```powershell
npm test -- tests/unit/onboarding-page.test.tsx
```

Expected: FAIL because Step 4 button does not call `createProject`.

- [ ] **Step 3: Implement create action**

In `onboarding-page.tsx`, import:

```ts
import { createProject } from "@/lib/api/projects";
```

Add state:

```ts
const [creatingProject, setCreatingProject] = useState(false);
const [setupMessage, setSetupMessage] = useState<string | null>(null);
```

Add handler:

```ts
async function handleCreateApplication() {
  if (!selectedStarterKit) {
    setSetupMessage("Select a repository before creating an application.");
    return;
  }

  setCreatingProject(true);
  setSetupMessage(null);
  try {
    await createProject({
      sourceType: "starter-kit",
      starterKitId: selectedStarterKit.id,
      repoName: selectedStarterKit.id.replace("-starter-kit", ""),
      visibility: "private",
      repoShape: "single-app",
      projectTypeId: selectedStarterKit.projectTypeId,
      workflowRecipeId: "frontend-standard-ci",
      serviceName: selectedStarterKit.id.replace("-starter-kit", ""),
      servicePath: ".",
      nodeVersion: "24",
      coverageThreshold: 80,
      tests: {
        lint: true,
        unit: true,
        build: true,
        coverage: true,
        security: true,
        docker: false,
      },
      outputFileName: "ci.yml",
    });
    setSetupMessage("Project created. Checks are ready for the first run.");
  } catch {
    setSetupMessage("Project could not be created. Try again.");
  } finally {
    setCreatingProject(false);
  }
}
```

Thread `onCreateApplication`, `creatingProject`, and `setupMessage` into `CreateApplicationStep`. Update button:

```tsx
<Button
  className="mt-2 w-full"
  data-action="create-application"
  loading={creatingProject}
  onClick={onCreateApplication}
>
  {creatingProject ? "Creating application..." : "Create application"}
</Button>
{setupMessage ? (
  <p className="m-0 text-sm leading-6 text-muted-foreground">{setupMessage}</p>
) : null}
```

- [ ] **Step 4: Run onboarding submit test**

Run:

```powershell
npm test -- tests/unit/onboarding-page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/features/dashboard/onboarding/onboarding-page.tsx tests/unit/onboarding-page.test.tsx
git commit -m "Create starter kit projects from onboarding"
```

## Task 6: Verification And Guardrails

**Files:**

- Read-only verification across FE and BE.

- [ ] **Step 1: Run backend targeted tests**

Run:

```powershell
npm test -- catalog.service.spec.ts github.service.spec.ts projects.service.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 2: Run frontend targeted tests**

Run:

```powershell
npm test -- tests/unit/onboarding-page.test.tsx tests/unit/workflow-hooks.test.tsx tests/unit/api-client.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run builds**

Run in `cicd-workflow-be`:

```powershell
npm run build
```

Expected: PASS.

Run in `cicd-workflow-fe`:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Customer-facing copy scan**

Run in `cicd-workflow-fe`:

```powershell
rg -n "Cloud Run|GCP|Render|Vercel|provider|runtime|Choose your plan" src/features/dashboard/onboarding src/lib/api/contracts.ts tests/unit/onboarding-page.test.tsx
```

Expected: no customer-facing onboarding copy leaks. Type names or comments in contracts are acceptable only if not rendered in onboarding.

- [ ] **Step 5: Final status**

Run in each repo:

```powershell
git status --short --branch
```

Expected: only intended commits are ahead; unrelated dirty files remain untouched.

## Self-Review

Spec coverage:

- Existing Step 3 tab target is covered by Task 4.
- No plan selector is covered by Tasks 3, 4, and 5 tests.
- Backend entitlement/source-of-truth requirement is partially covered in Phase 1 by rejecting client `plan` and deriving setup from backend catalog; full Solo/Plus/Pro enforcement remains a follow-up because current backend subscription naming still uses existing plan codes.
- Starter-kit repository creation is covered by Task 2.
- Existing repository setup PR behavior remains unchanged and is not modified by this plan.

Placeholder scan:

- The plan defines each edit target, command, and expected result.

Known risks:

- `cicd-workflow-fe` and `cicd-workflow-be` currently have unrelated dirty work. Implementation must inspect and preserve those changes before editing.
- Existing backend code still contains legacy deployment-provider concepts. This plan avoids exposing those in onboarding, but a wider cleanup belongs to the provider migration plan.
