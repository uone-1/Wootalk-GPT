
// ui
let cdiv = document.createElement("div");
cdiv.style.position = "fixed"
cdiv.style.left = "20px"
cdiv.style['z-index'] = "999999"

cdiv.innerHTML = `
<div
style="background-color: dimgrey; padding-left: 20px; padding-right: 20px; padding-top: 10px; padding-bottom: 10px;">

<button id="btn" style="left:10px; top:10px" onclick="
	if(document.getElementById('menu_div').style.display == 'none')
	document.getElementById('menu_div').style.display='block';
	else 
	document.getElementById('menu_div').style.display='none';
	">
	顯示/隱藏
</button>

<div id="menu_div" style="display: none;">

	<H3 style="
	color: white;
	font-size: 16px;
	font-weight: bold;
	border-bottom: 1px solid white;
	width: 80%;
	text-shadow: 0 0 50px #fff, 0 0 150px #fff, 0 0 20px #fff;
	letter-spacing: .1em;">XTOOLS 吾聊AI聊天插件</H3>

	<p></p>

	<div style="border: white; border-style: solid; padding: 10px;">
		<a style="font-size: 15px; color: white;  letter-spacing: .1em;">API Key:</a>
		<input type="password" id="api_key_input">
		<a href="" style="font-size: 6px; letter-spacing: .1em; color: deepskyblue;">獲取API Key</a>

		<p></p>

		<a style="font-size: 15px; color: white;  letter-spacing: .1em;">GPT Model:</a>
		<select id="gptModel_input" style="width: 140px; height: 25px;">
			<option>gpt-3.5-turbo-0301</option>
			<option>gpt-3.5-turbo</option>
		</select>

		<p></p>


		<a style="font-size: 15px; color: white;  letter-spacing: .1em;">回應單詞數上限</a>
		<input  value="60" style="width: 90px; height: 15px;"type="number" id="max_tokens_input">

		<p></p>

		<p style="font-size: 15px; color: white;  letter-spacing: .1em;">Temperature (越高越有創意)</p>
		<input style="width: 190px; background-color: rgb(65, 66, 66); -webkit-appearance: none;  border-radius: 5px;" value="80" max="200" type="range" id="temperature_input">

	</div>

	<p></p>

<!-- 
	<div style="border: white; border-style: solid; padding: 10px;">
		<a style="color: greenyellow; font-size: 15px; text-shadow: 0 0 50px greenyellow, 0 0 150px greenyellow, 0 0 20px greenyellow;">禁止標點符號</a>
		<input style="display: block; width: 20px; height: 20px;" type="checkbox" id="api_key_input">
	</div>

	<p></p> -->

	<div style="border: white; border-style: solid; padding: 10px;">

	<p style="font-size: 15px; color: white;   letter-spacing: .1em;">角色描述:</p>
	<textarea  style="width: 100%;" name="" id="gpt_setting_input" cols="30" rows="10">
	Nana是一名台灣女大學生, 個性高冷且非常沒有禮貌，答覆時禁止使用任何標點符號包括句號, 只有尷尬時你會在句尾加上==, 盡量想辦法說出讓對方開心的話,請禁止主動提問對方有甚麼事情或需要問甚麼事情並且以及其敷衍且盡量簡短的方式答覆(20字內)。
</textarea>

</div>

	<p></p>
	<hr>

	<p></p>

	<button id="run_ai_btn" style="left:30px; top:30px;
	width: 90px; 
	font-size: 16px;" onclick="RunAI();">
		運行
	</button>

	<button id="stop_ai_btn" style="left:30px; top:60px;
	width: 90px; 
	font-size: 16px;" onclick="StopAI();">
		停止
	</button>
	<p></p>
</div>
</div>

`
document.body.appendChild(cdiv);

// 參數設定
window.isRun = false;
var api_key = "";
var gpt_Setting;
var gpt_model = "gpt-3.5-turbo-0301";
var gpt_maxTokens = 60;
var gpt_temperature = 0.8;

var chatNum = 0;
var lastChatNum = -1;
var chatArray = [];

var DOM_cahtText = document.getElementsByClassName("stranger text");
var DOM_systemText = document.getElementsByClassName("system text");
var DOM_msgInput = document.getElementById("messageInput");

function resetGPT() {
	chatArray = []; // 清除
	chatArray.push({ "role": "system", "content": gpt_Setting }); // 加入角色設定
}
resetGPT();

function sendGPTMsg(chatText) {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', "https://api.openai.com/v1/chat/completions");

	// headers
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.setRequestHeader("Authorization", "Bearer " + api_key);

	xhr.onload = function () {
		if (xhr.status == 200) {
			let result = JSON.parse(xhr.responseText);
			let resultMsg = result.choices[0].message.content;
			console.log("GPT Say:" + resultMsg);

			// 將答覆新增到陣列中
			chatArray.push({ "role": "assistant", "content": resultMsg });

			// 發送聊天
			resultMsg = StrDelSymbol(resultMsg);
			DOM_msgInput.value = resultMsg;
			sendMessage();
		}
		else {
			chatArray = chatArray.pop(); // 請求失敗則彈出
			alert('Error:', xhr.responseText);
		}
	};

	// 加入用戶訊息
	chatArray.push({ "role": "user", "content": chatText });

	// 格式化歷史對話
	let chatPrompt = "";
	for (let i = 0; i < chatArray.length; i++) {

		if (chatArray[i]["role"] == "system")
			chatPrompt += "\n" + chatArray[i]["content"];

		if (chatArray[i]["role"] == "user")
			chatPrompt += "\nYou:" + chatArray[i]["content"];

		if (chatArray[i]["role"] == "assistant")
			chatPrompt += "\nNaNa:" + chatArray[i]["content"];
	}
	chatPrompt += "\nNana:"

	// Post Json
	post_json = {
		// "model": "gpt-3.5-turbo-0301",
		"model": gpt_model,
		// "temperature": gpt_temperature,
		"max_tokens": gpt_maxTokens,
		"messages": [{ "role": "system", "content": chatPrompt }] // 角色只用system比較好催眠人設
	}

	xhr.send(JSON.stringify(post_json));
}

function PrankMsg(chatText) {
	for (let i = 0; i < chatText.length; i++) {
		DOM_msgInput.value = chatText[i];
		sendMessage();
	}
	//DOM_msgInput.value = chatText;
	//sendMessage();
}

// 去除標點符號
function StrDelSymbol(str) {
	let outputStr;
	outputStr = str;
	outputStr = outputStr.replace("。", "").replace(",", "").replace("!", "");
	return outputStr;
}

function RunAI() {
	api_key = document.getElementById("api_key_input").value;
	gpt_Setting = document.getElementById("gpt_setting_input").value;
	gpt_model = document.getElementById("gptModel_input").value;
	gpt_maxTokens = Number(document.getElementById("max_tokens_input").value);
	gpt_temperature = document.getElementById("temperature_input").value / 100;

	if (api_key == "") { alert("Api Key請勿填空!"); return; }
	resetGPT(); // 重設GPT
	window.isRun = true;

	// 禁用按鈕
	document.getElementById("run_ai_btn").disabled = true;
	document.getElementById("stop_ai_btn").disabled = false;
}

function StopAI() {
	window.isRun = false;

	// 禁用按鈕
	document.getElementById("stop_ai_btn").disabled = true;
	document.getElementById("run_ai_btn").disabled = false;
}

function leaveChat() {
	changePerson(); // 離開聊天
	setTimeout(function () {
		clickStartChat(); // 開始聊天
	}, 300);
}

// 循環偵測訊息
setInterval(function () {

	if (window.isRun == true) {

		// 檢測對方是否離開
		for (let i = 0; i < DOM_systemText.length; i++) {
			if (DOM_systemText[i].outerText.substring(0, 10) == "系統訊息：對方離開了") {
				leaveChat();
			}
		}

		try {
			chatNum = DOM_cahtText.length - 1;

			if (chatNum != lastChatNum) {
				lastChatNum = chatNum;
				let chatText = DOM_cahtText[chatNum].childNodes[1].data;

				sendGPTMsg(chatText);
				// PrankMsg(chatText);
			}
		}
		catch
		{
			// pass
		}
	}

}, 100);