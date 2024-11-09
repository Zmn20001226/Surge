const isRequest = typeof $request !== 'undefined';
const isCron = typeof $environment !== 'undefined' && $environment.cron;
const notify = (title, subtitle, message) => $notification.post(title, subtitle, message);

// 保存和读取参数
const saveData = (key, value) => {
  const success = $persistentStore.write(value, key);
  if (!success) notify('Emby 自动观看', '错误', `保存 ${key} 失败`);
};
const readData = (key) => $persistentStore.read(key) || '';

// 处理请求，保存观看数据
if (isRequest) {
  try {
    const requestBody = JSON.parse($request.body || '{}');
    const sessionId = requestBody.SessionId || '';
    const mediaId = requestBody.ItemId || '';

    if (sessionId && mediaId) {
      saveData('emby_sessionId', sessionId);
      saveData('emby_mediaId', mediaId);
      notify('Emby 自动观看', '参数获取成功', `SessionId: ${sessionId}, MediaId: ${mediaId}`);
    } else {
      notify('Emby 自动观看', '参数获取失败', '请检查是否正确播放过视频。');
    }
  } catch (error) {
    notify('Emby 自动观看', '错误', `解析请求体时出错：${error.message}`);
  }
  $done(); // 结束请求处理
}

// 定时任务，模拟观看请求
if (isCron) {
  try {
    const sessionId = readData('emby_sessionId');
    const mediaId = readData('emby_mediaId');

    if (!sessionId || !mediaId) {
      notify('Emby 自动观看', '错误', '未找到有效的 SessionId 或 MediaId，请重新获取。');
      $done(); // 结束脚本执行
    } else {
      const watchUrl = `https://your-emby-server-url/emby/Sessions/Playing`;
      const headers = {
        'Content-Type': 'application/json',
      };
      const body = JSON.stringify({
        SessionId: sessionId,
        ItemId: mediaId,
        MediaSourceId: mediaId,
        PositionTicks: 10000000,
        PlayMethod: 'DirectStream',
      });

      const requestOptions = {
        url: watchUrl,
        method: 'POST',
        headers: headers,
        body: body,
      };

      // 发起异步请求，并确保结束后调用 $done()
      $httpClient.post(requestOptions, (error, response, data) => {
        if (error) {
          notify('Emby 自动观看', '请求失败', error);
        } else {
          notify('Emby 自动观看', '模拟观看成功', `响应状态: ${response.status}`);
        }
        $done(); // 异步请求结束后调用 $done()
      });
    }
  } catch (error) {
    notify('Emby 自动观看', '错误', `定时任务时出错：${error.message}`);
    $done(); // 异常时调用 $done()
  }
}
