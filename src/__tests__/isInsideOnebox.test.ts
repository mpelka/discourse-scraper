import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { isInsideOnebox } from "../index";

describe("isInsideOnebox", () => {
  beforeAll(() => {
    GlobalRegistrator.register();
  });

  afterAll(() => {
    GlobalRegistrator.unregister();
  });
  test("should return true when element is inside onebox", () => {
    document.body.innerHTML = `
      <div class="onebox">
        <p id="child">Content inside onebox</p>
      </div>
    `;

    const childElement = document.getElementById("child") as Element;
    expect(isInsideOnebox(childElement)).toBe(true);
  });

  test("should return false when element is not inside onebox", () => {
    document.body.innerHTML = `
      <div class="regular">
        <p id="child">Content outside onebox</p>
      </div>
    `;

    const childElement = document.getElementById("child") as Element;
    expect(isInsideOnebox(childElement)).toBe(false);
  });

  test("should return false for element without any parent", () => {
    document.body.innerHTML = `<p id="standalone">Standalone element</p>`;

    const standaloneElement = document.getElementById("standalone") as Element;
    expect(isInsideOnebox(standaloneElement)).toBe(false);
  });
});
