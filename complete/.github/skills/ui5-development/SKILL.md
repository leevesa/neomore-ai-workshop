---
name: ui5-development
description: 'Develop, review, and debug SAPUI5 applications. Use for UI5 controls, XML views, controllers, models, bindings, OData, icons, accessibility, testing, and build configuration.'
---

# UI5 Development

## Working Method

1. Inspect `package.json`, `ui5.yaml`, and `manifest.json` before changing code. Follow the UI5 version, libraries, module format, and conventions already used by the project.
2. Verify controls, properties, aggregations, events, and APIs in the official [UI5 API Reference](https://ui5.sap.com/#/api). Do not invent UI5 APIs.
3. Keep presentation in XML views, behavior in controllers, reusable transformations in formatter or utility modules, and application configuration in `manifest.json`.
4. Prefer data binding and UI5 model APIs over direct DOM access. Use asynchronous APIs without blocking the UI thread.
5. Put user-facing text in the i18n resource bundle. Preserve keyboard access, labels, semantic control types, and responsive behavior.
6. Make the smallest change that follows the existing architecture, then run the project's focused tests, lint, and UI5 build.

## Verify Icons

Before adding or changing an SAP icon, verify that its name exists in the official [SAPUI5 Icon Explorer](https://ui5.sap.com/test-resources/sap/m/demokit/iconExplorer/webapp/index.html#/overview/SAP-icons/?tab=grid&search=nameoficon).

1. Replace `nameoficon` in the search query with the intended icon name or concept.
2. Select an icon whose meaning matches the action and copy its exact registered name.
3. Use the verified URI in the form `sap-icon://<name>`. Never infer an icon URI from an English action label.
4. When the application is runnable, confirm version-specific availability with `sap/ui/core/IconPool.getIconInfo("<name>")` and visually inspect the rendered control.
5. Keep a tooltip or accessible label on icon-only buttons.

## Validation

- Run the nearest unit test for changed controller, formatter, or utility behavior.
- Run the repository's lint and UI5 build commands.
- For visual changes, verify desktop and mobile layouts in a browser and check that controls, text, and icons render without overlap.