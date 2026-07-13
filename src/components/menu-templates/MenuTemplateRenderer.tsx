import { ClassicMenuTemplate } from "./ClassicMenuTemplate";
import { DarkMenuTemplate } from "./DarkMenuTemplate";
import { MinimalMenuTemplate } from "./MinimalMenuTemplate";
import { ModernMenuTemplate } from "./ModernMenuTemplate";
import type { MenuTemplateProps } from "./types";

export function MenuTemplateRenderer({ menu, products, themeId }: MenuTemplateProps & { themeId: string }) {
  const props = { menu, products };
  switch (themeId) {
    case "modern":
      return <ModernMenuTemplate {...props} />;
    case "minimal":
      return <MinimalMenuTemplate {...props} />;
    case "dark":
      return <DarkMenuTemplate {...props} />;
    case "classic":
    default:
      return <ClassicMenuTemplate {...props} />;
  }
}
