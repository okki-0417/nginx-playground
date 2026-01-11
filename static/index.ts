const tabs = document.getElementById("tabs")!;
const editor = document.getElementById("editor") as HTMLTextAreaElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const reloadBtn = document.getElementById("reload-btn") as HTMLButtonElement;
const status = document.getElementById("status")!;

// 各ファイルの状態を管理
type FileState = { content: string; originalContent: string; modified: boolean };
const fileStates = new Map<string, FileState>();
let currentFile: string | null = null;

async function loadFileList() {
  try {
    const res = await fetch("/api/admin/sites");
    const files: string[] = await res.json();

    tabs.innerHTML = files
      .map((f) => {
        // タブ表示名: "00-upstream.conf" → "upstream", "locations/static.conf" → "static"
        const displayName = f
          .replace(".conf", "")
          .replace(/^\d+-/, "")
          .replace("locations/", "");
        return `<a class="tab" data-file="${f}">${displayName}</a>`;
      })
      .join("");

    // 各ファイルの内容を事前に読み込み
    await Promise.all(files.map(loadFileContent));

    // タブクリックイベント
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const file = (tab as HTMLElement).dataset.file;
        if (file) switchTab(file);
      });
    });

    // 最初のタブを選択
    if (files.length > 0 && files[0]) {
      switchTab(files[0]);
    }
  } catch (error) {
    tabs.innerHTML = '<span class="text-error">読み込みエラー</span>';
  }
}

async function loadFileContent(name: string) {
  try {
    const res = await fetch(`/api/admin/sites/${name}`);
    const data = await res.json();
    fileStates.set(name, {
      content: data.content,
      originalContent: data.content,
      modified: false,
    });
  } catch (error) {
    console.error(`Failed to load ${name}:`, error);
  }
}

function switchTab(name: string) {
  // 現在の編集内容を保存
  if (currentFile && fileStates.has(currentFile)) {
    const state = fileStates.get(currentFile)!;
    state.content = editor.value;
    state.modified = state.content !== state.originalContent;
    updateTabStyle(currentFile, state.modified);
  }

  // 新しいタブに切り替え
  currentFile = name;
  const state = fileStates.get(name);
  if (state) {
    editor.value = state.content;
    editor.disabled = false;
    saveBtn.disabled = false;
  }

  // タブのアクティブ状態を更新
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("tab-active", (tab as HTMLElement).dataset.file === name);
  });

  status.textContent = "";
}

function updateTabStyle(name: string, modified: boolean) {
  const tab = document.querySelector(`.tab[data-file="${name}"]`);
  if (tab) {
    tab.classList.toggle("after:content-['*']", modified);
    tab.classList.toggle("after:text-orange-500", modified);
  }
}

async function saveCurrentFile() {
  if (!currentFile) return;

  const state = fileStates.get(currentFile);
  if (!state) return;

  state.content = editor.value;

  try {
    saveBtn.disabled = true;
    status.textContent = "保存中...";
    status.className = "mt-2 text-sm";

    const res = await fetch(`/api/admin/sites/${currentFile}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: state.content }),
    });

    const data = await res.json();
    if (data.success) {
      state.originalContent = state.content;
      state.modified = false;
      updateTabStyle(currentFile, false);
      status.textContent = `${currentFile} を保存しました`;
      status.className = "mt-2 text-sm text-success";
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    status.textContent = "保存に失敗: " + (error as Error).message;
    status.className = "mt-2 text-sm text-error";
  } finally {
    saveBtn.disabled = false;
  }
}

async function reloadNginx() {
  try {
    reloadBtn.disabled = true;
    reloadBtn.textContent = "reloading...";

    const res = await fetch("/api/admin/reload", { method: "POST" });
    const data = await res.json();

    if (data.success) {
      status.textContent = "nginx をリロードしました";
      status.className = "mt-2 text-sm text-success";
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    status.textContent = "リロード失敗: " + (error as Error).message;
    status.className = "mt-2 text-sm text-error";
  } finally {
    reloadBtn.disabled = false;
    reloadBtn.textContent = "nginx reload";
  }
}

// イベントリスナー
saveBtn.addEventListener("click", saveCurrentFile);
reloadBtn.addEventListener("click", reloadNginx);

editor.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();
    saveCurrentFile();
  }
});

editor.addEventListener("input", () => {
  if (currentFile && fileStates.has(currentFile)) {
    const state = fileStates.get(currentFile)!;
    state.content = editor.value;
    state.modified = state.content !== state.originalContent;
    updateTabStyle(currentFile, state.modified);
  }
});

// 初期化
loadFileList();
