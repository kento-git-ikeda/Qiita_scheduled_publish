setInterval(() => {
  chrome.storage.local.get({ publishSchedules: [] }, async (result) => {
    const schedules = result.publishSchedules;

    if (!Array.isArray(schedules) || schedules.length == 0) {
      return; // 存在しない場合は処理を中止
    }

    for (const schedule of schedules) {
      const scheduledTime = new Date(schedule.scheduledDate).getTime();
      const currentTime = Date.now();

      if (scheduledTime <= currentTime) {
        try {
          await updateArticleToPublic(
            schedule.itemId,
            schedule.accessToken,
            schedule.organization,
            schedule.articleData
          );
          console.log(`予約投稿された記事を公開しました: ${schedule.itemId}`);
        } catch (error) {
          console.error(
            `予約投稿された記事の更新に失敗しました: ${schedule.itemId} (${error.message})`
          );
        }
        updateLocalStorage(schedule.itemId, schedule.scheduledDate);
      }
    }
  });
}, 60000);

async function updateArticleToPublic(
  itemId,
  accessToken,
  organization,
  articleData
) {
  const response = await fetch(`https://qiita.com/api/v2/items/${itemId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: articleData.title,
      body: articleData.body,
      tags: articleData.tags,
      organization_url_name: organization,
      private: false, // 公開状態にする
    }),
  });

  if (!response.ok) {
    throw new Error(`記事の公開に失敗しました: ${response.statusText}`);
  }

  return await response.json();
}

function updateLocalStorage(id, date) {
  chrome.storage.local.get({ publishSchedules: [] }, (result) => {
    const updatedStorage = result.publishSchedules.filter(
      (schedule) => schedule.itemId != id
    );

    chrome.storage.local.set({ publishSchedules: updatedStorage }, () => {
      console.log(`スケジュールを削除しました: ${id} ${date}`);
    });
    chrome.storage.local.get({ publishSchedules: [] }, (result) => {
      console.log("今後のスケジュール:", result.publishSchedules);
    });
  });
}
