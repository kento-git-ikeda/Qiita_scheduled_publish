document.getElementById("publishButton").addEventListener("click", async () => {
  const accessToken = localStorage.getItem("accessToken");
  const organization = localStorage.getItem("organization");
  const itemUrl = document.getElementById("itemUrl").value;
  const scheduledDate = document.getElementById("scheduledDate").value;

  if (!accessToken) {
    alert("アクセストークンを設定してください");
    return;
  }

  if (!scheduledDate) {
    alert("予約日時を設定してください");
    return;
  } else {
    const itemId = getItemIdFromUrl(itemUrl);
    const articleData = await getArticle(itemId, accessToken);
    const scheduleData = {
      itemId,
      scheduledDate,
      accessToken,
      organization,
      articleData,
    };

    // スケジュールをlocalStorageに保存
    chrome.storage.local.get({ publishSchedules: [] }, (result) => {
      const schedules = result.publishSchedules;
      schedules.push(scheduleData);
      chrome.storage.local.set({ publishSchedules: schedules }, () => {
        // 最新のスケジュール情報を取得
        chrome.storage.local.get({ publishSchedules: [] }, (latestResult) => {
          const latestSchedule =
            latestResult.publishSchedules[
              latestResult.publishSchedules.length - 1
            ];

          if (latestSchedule && latestSchedule.scheduledDate) {
            alert(
              `予約投稿を次の日時に設定しました: ${latestSchedule.scheduledDate}`
            );
          } else {
            alert("スケジュールが設定されていません");
          }

          window.close();
        });
      });
    });

    return;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (e) => {
    const url = e[0].url;
    // itemUrl 入力欄に現在のURLを設定
    document.getElementById("itemUrl").value = url;
  });
});

document.getElementById("settingsButton").addEventListener("click", () => {
  // 設定画面に切り替える
  document.querySelector(".publish").style.display = "none";
  document.querySelector(".settings").style.display = "block";

  // 保存済みのアクセストークンをフォームに表示
  const savedToken = localStorage.getItem("accessToken");
  if (savedToken) {
    document.getElementById("accessToken").value = savedToken;
  }
  // 保存済みの組織をフォームに表示
  const organization = localStorage.getItem("organization");
  if (organization) {
    document.getElementById("organization").value = organization;
  }
});

document.getElementById("saveButton").addEventListener("click", () => {
  const accessToken = document.getElementById("accessToken").value;
  const organization = document.getElementById("organization").value;

  if (accessToken) {
    // localStorageに保存
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("organization", organization);
    alert("設定完了しました");
    // 設定画面から公開画面に戻す
    document.querySelector(".settings").style.display = "none";
    document.querySelector(".publish").style.display = "block";
  } else {
    alert("無効な入力です");
  }
});

document.getElementById("backButton").addEventListener("click", () => {
  // 設定画面から公開画面に戻す
  document.querySelector(".settings").style.display = "none";
  document.querySelector(".publish").style.display = "block";
});

function getItemIdFromUrl(itemUrl) {
  try {
    const urlObj = new URL(itemUrl);
    const pathSegments = urlObj.pathname.split("/");
    return pathSegments[pathSegments.length - 1];
  } catch (error) {
    alert("無効なURLです:", error);
    return null;
  }
}

async function getArticle(itemId, accessToken) {
  const response = await fetch(`https://qiita.com/api/v2/items/${itemId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`限定共有記事の取得に失敗しました: ${response.statusText}`);
  }

  return await response.json();
}
