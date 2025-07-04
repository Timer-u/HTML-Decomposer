document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  const loadingOverlay = document.getElementById("loading-overlay");
  const fileInfo = document.getElementById("file-info");
  const tabs = document.querySelectorAll(".tab");
  const fileInput = document.getElementById("file-input");
  const htmlInput = document.getElementById("html-input");
  const decomposeBtn = document.getElementById("decompose-btn");
  const resetBtn = document.getElementById("reset-btn");
  const htmlOutput = document.getElementById("html-output");
  const cssOutput = document.getElementById("css-output");
  const jsOutput = document.getElementById("js-output");
  const downloadBtns = document.querySelectorAll(".download-btn");
  const notification = document.getElementById("notification");

  // 显示/隐藏加载状态
  function setLoading(isLoading) {
    if (isLoading) {
      loadingOverlay.classList.add("active");
      decomposeBtn.disabled = true;
      decomposeBtn.textContent = "Processing...";
    } else {
      loadingOverlay.classList.remove("active");
      decomposeBtn.disabled = false;
      decomposeBtn.textContent = "Decompose HTML";
    }
  }

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      document.querySelectorAll(".tab-content").forEach((tc) => {
        tc.classList.remove("active");
      });

      const tabId = this.getAttribute("data-tab");
      document.getElementById(`${tabId}-tab`).classList.add("active");
    });
  });

  // File upload handling
  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;

      setLoading(true);
      const reader = new FileReader();
      reader.onload = function (event) {
        htmlInput.value = event.target.result;
        setLoading(false);
        tabs[0].click();
      };
      reader.readAsText(file);
    } else {
      fileInfo.textContent = "No file selected";
    }
  });

  // 格式化文件大小
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Decompose functionality (优化大文件处理)
  decomposeBtn.addEventListener("click", function () {
    const htmlContent = htmlInput.value;

    if (!htmlContent.trim()) {
      showNotification("Please enter HTML content first");
      return;
    }

    setLoading(true);

    // 使用setTimeout将处理放到下一个事件循环，避免阻塞UI
    setTimeout(() => {
      try {
        // 使用正则表达式
        let cleanHTML = htmlContent;
        let cssContent = "";
        let jsContent = "";

        // 提取CSS（处理<style>标签）
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let styleMatch;
        while ((styleMatch = styleRegex.exec(htmlContent)) !== null) {
          cssContent += styleMatch[1] + "\n";
          cleanHTML = cleanHTML.replace(styleMatch[0], "");
        }

        // 提取JavaScript（处理<script>标签）
        const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
        let scriptMatch;
        while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
          // 只提取内联脚本
          if (!scriptMatch[0].includes("src=")) {
            jsContent += scriptMatch[1] + "\n";
            cleanHTML = cleanHTML.replace(scriptMatch[0], "");
          }
        }

        // 清理HTML中的多余空格
        cleanHTML = cleanHTML
          .replace(/\n\s*\n/g, "\n") // 移除多余空行
          .trim();

        // 显示结果
        htmlOutput.textContent = cleanHTML;
        cssOutput.textContent = cssContent.trim() || "/* No CSS found */";
        jsOutput.textContent = jsContent.trim() || "// No JavaScript found";

        showNotification("HTML decomposed successfully!");
      } catch (error) {
        console.error("Decomposition error:", error);
        showNotification("Error: " + error.message);
      } finally {
        setLoading(false);
      }
    }, 50);
  });

  // Reset functionality
  resetBtn.addEventListener("click", function () {
    htmlInput.value = "";
    htmlOutput.textContent = "";
    cssOutput.textContent = "";
    jsOutput.textContent = "";
    fileInput.value = "";
    fileInfo.textContent = "No file selected";
    showNotification("All inputs and outputs have been cleared");
  });

  // Download functionality
  downloadBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const type = this.getAttribute("data-type");
      let content, fileName, mimeType;

      switch (type) {
        case "html":
          content = htmlOutput.textContent;
          fileName = "output.html";
          mimeType = "text/html";
          break;
        case "css":
          content = cssOutput.textContent;
          fileName = "styles.css";
          mimeType = "text/css";
          break;
        case "js":
          content = jsOutput.textContent;
          fileName = "script.js";
          mimeType = "text/javascript";
          break;
      }

      if (
        !content.trim() ||
        content.includes("No ") ||
        content.includes("/* No")
      ) {
        showNotification("No content to download");
        return;
      }

      downloadFile(content, fileName, mimeType);
      showNotification(`${fileName} downloaded successfully!`);
    });
  });

  // Helper function to download files
  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Helper function to show notifications
  function showNotification(message) {
    notification.textContent = message;
    notification.classList.add("show");

    setTimeout(() => {
      notification.classList.remove("show");
    }, 3000);
  }
});
