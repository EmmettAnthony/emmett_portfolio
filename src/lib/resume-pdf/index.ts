import { ModernPDF } from "./modern";
import { CorporatePDF } from "./corporate";
import { MinimalistPDF } from "./minimalist";
import { DeveloperPDF } from "./developer";
import { ExecutivePDF } from "./executive";
import { PDFTemplateProps } from "./shared";

export const resumePDFTemplates: Record<string, React.ComponentType<PDFTemplateProps>> = {
  modern: ModernPDF,
  corporate: CorporatePDF,
  minimalist: MinimalistPDF,
  developer: DeveloperPDF,
  executive: ExecutivePDF,
};

export type { PDFTemplateProps };
