import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { WorkHubApp } from "./App";

export class WorkHub implements ComponentFramework.StandardControl<
  IInputs,
  IOutputs
> {
  private root: Root | undefined;
  private container: HTMLDivElement | undefined;
  private selectedId = "";
  private notifyOutputChanged: () => void = () => {
    /* 초기화 전에는 알림을 보내지 않습니다. */
  };
  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    _state: ComponentFramework.Dictionary,
    container: HTMLDivElement,
  ): void {
    this.container = container;
    container.classList.add("wh-root");
    this.root = createRoot(container);
    this.notifyOutputChanged = notifyOutputChanged;
    context.mode.trackContainerResize(true);
    this.updateView(context);
  }
  public updateView(context: ComponentFramework.Context<IInputs>): void {
    if (!this.container) return;
    const height = Number(context.mode.allocatedHeight);
    this.container.style.height = height > 0 ? `${height}px` : "900px";
    this.container.style.width = "100%";
    this.root?.render(
      React.createElement(WorkHubApp, {
        userName: context.parameters.userName.raw?.trim() || "김민서",
        readOnly:
          context.parameters.readOnly.raw === true ||
          context.mode.isControlDisabled,
        onSelection: (id: string) => {
          this.selectedId = id;
          this.notifyOutputChanged();
        },
      }),
    );
  }
  public getOutputs(): IOutputs {
    return { selectedId: this.selectedId };
  }
  public destroy(): void {
    this.root?.unmount();
  }
}
