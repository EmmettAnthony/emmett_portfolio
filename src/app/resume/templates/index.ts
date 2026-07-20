import { ModernTemplate } from "./modern";
import { CorporateTemplate } from "./corporate";
import { MinimalistTemplate } from "./minimalist";
import { DeveloperTemplate } from "./developer";
import { ExecutiveTemplate } from "./executive";
import type { TemplateProps } from "./types";

export const resumeTemplates: Record<string, React.ComponentType<TemplateProps>> = {
  modern: ModernTemplate,
  corporate: CorporateTemplate,
  minimalist: MinimalistTemplate,
  developer: DeveloperTemplate,
  executive: ExecutiveTemplate,
};

export type TemplateName = keyof typeof resumeTemplates;
