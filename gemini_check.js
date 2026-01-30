/**
 * Gemini Availability Check for Quantumult X
 * Author: Gemini
 * * 使用方法 (配置文件 [task_local] 中添加):
 * event-interaction https://raw.githubusercontent.com/你的路径/gemini_check.js, tag=Gemini 查询, img-url=https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg, enabled=true
 */

const BASE_URL = 'https://gemini.google.com';
const TIMEOUT_MS = 5000;

var opts = {
  policy: $environment.params
};

!(async () => {
  let result = {
    title: 'Gemini 解锁检测',
    content: '检测中...',
  }

  await Promise.race([checkGemini(), timeOut(TIMEOUT_MS)])
    .then((resp) => {
      console.log("Gemini Check Result: " + JSON.stringify(resp));
      
      let status = resp.status; 
      let color = "red"; // 默认红色
      
      if (status == 0) {
          result['content'] = '该节点支持 Gemini ➟ ⟦ 🟢 完整解锁 ⟧';
          color = "#00C853"; // 绿色
      } else if (status == 1) {
          result['content'] = '该节点不支持 Gemini ➟ ⟦ 🔴 地区限制 ⟧';
          color = "#D50000"; // 红色
      } else if (status == 2) {
          result['content'] = '检测超时 ➟ 请检查网络';
          color = "#FFD600"; // 黄色
      } else {
          result['content'] = '未知错误: ' + resp.msg;
          color = "gray";
      }

      // UI 渲染
      let content = `<p style="text-align: center; font-family: -apple-system; font-size: large; font-weight: thin">`
      content += `------------------------------<br><br>`
      content += result['content']
      content += `<br><br>------------------------------<br>`
      content += `<font color=${color}><b>节点</b> ➟ ${$environment.params}</font>`
      content += `</p>`
      
      $done({"title": result.title, "htmlMessage": content})
    })
})()
.finally(() => $done());

function timeOut(delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({status: 2, msg: "timeout"})
    }, delay)
  })
}

function checkGemini() {
  return new Promise((resolve) => {
    let option = {
      url: BASE_URL,
      opts: opts,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      },
      redirection: true // 允许自动重定向
    }

    $task.fetch(option).then(response => {
      // 调试日志
      // console.log("Status: " + response.statusCode);
      
      if (response.statusCode === 200) {
          // 如果返回 200，检查内容是否包含“所在国家/地区不支持”的提示
          if (response.body && response.body.includes("currently not available")) {
              resolve({status: 1, msg: "Geo Blocked"})
          } else {
              // 正常进入页面，视为解锁
              resolve({status: 0, msg: "OK"})
          }
      } 
      else if (response.statusCode === 302 || response.statusCode === 301) {
          // 跳转通常是去登录页，视为解锁
          resolve({status: 0, msg: "Redirect OK"}) 
      }
      else if (response.statusCode === 403) {
          // 403 视为封锁
          resolve({status: 1, msg: "403 Forbidden"})
      }
      else {
          resolve({status: 3, msg: "Code: " + response.statusCode})
      }
    }, error => {
      resolve({status: 3, msg: "Network Error"})
    })
  })
}
