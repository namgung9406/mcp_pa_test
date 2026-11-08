import * as React from "react";
import { createRoot } from "react-dom/client";
import { WorkHubApp } from "../WorkHub/App";
const container = document.getElementById("app");
if (container)
  createRoot(container).render(
    <WorkHubApp
      userName="김민서"
      readOnly={new URLSearchParams(location.search).get("readonly") === "1"}
      onSelection={() => {
        /* 미리보기에서는 Canvas 출력을 연결하지 않습니다. */
      }}
    />,
  );
