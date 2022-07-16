import puppeteer from "puppeteer";

const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
export const delay = async (ms) => await setTimeout(() => {}, [ms]);

export let requestMap = new Map();
export let token = null;
export let page = null;
export let nonce = 0;
export let browser = null
export let armies = new Map();

const headers = {
    accept: "text/plain, */*; q=0.01",
    "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "sec-ch-ua": '"Chromium";v="103", ".Not/A)Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "x-requested-with": "XMLHttpRequest",
}

export async function getGemHunt(token, tries = 0) {
    nonce++;
    let gemInfo = await fetch(
        `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
            token
        )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
        {
            headers: headers,
            referrer: "https://www.citieswar.com/main",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B33%2C%22%22%5D%2C%22I%22%3A${nonce}%7D`,
            method: "POST",
            mode: "cors",
            credentials: "include",
        }
    )
        .then((res) => res.json())
        .then((res) => res);
    nonce++;
    if (!gemInfo?.R?.LeftGemsCount) return console.log(gemInfo);
    console.log("Gems available: ", gemInfo.R.LeftGemsCount);
    console.table(gemInfo);
    let gemHunt = await fetch(
        `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
            token
        )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
        {
            headers: headers,
            referrer: "https://www.citieswar.com/main",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B34%2C${gemInfo.R.LeftGemsCount}%5D%2C%22I%22%3A${nonce}%7D`,
            method: "POST",
            mode: "cors",
            credentials: "include",
        }
    )
        .then((res) => res.json())
        .then((res) => res);
    if (gemHunt?.R?.GemsResult !== 2 && tries < 6) getGemHunt(token, tries + 1);
    console.log("Gem hunt result");
    console.table(gemHunt);
}

export async function buildMines(token, mineid, type, tries = 0) {
    nonce++;
    let res = await fetch(
        `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
            token
        )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
        {
            headers: headers,
            referrer: "https://www.citieswar.com/main",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B8%2C%22${mineid}%26${type}%260%22%5D%2C%22I%22%3A${nonce}%7D`,
            method: "POST",
            mode: "cors",
            credentials: "include",
        }
    )
        .then((res) => res.json())
        .then((res) => res)
        .catch((err) => console.log(err));
    await delay(1000);
    if (res && res?.R?.Result === 1) {
        console.log("Mine has been built.", "Tries: ", tries);
        console.table(res);
        return res;
    } else if (tries > 6) return res;
    else return await buildMines(token, mineid, type, tries + 1);
}

export function parseRequest(data) {
    try {
        return JSON.parse(decodeURIComponent(data).split("data=")[1]);
    } catch {
        return undefined;
    }
}

export async function createBuilder(login, pwd) {
    try {
        // Create browser instance, and give it a first tab
        browser = await puppeteer.launch({
            headless: !true,
            defaultViewport: null,
        });
        page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
        await page.setRequestInterception(true);

        let control = false;

        page.on("request", async (request) => {
            try {
                let postData = request.postData();
                let requestId = request._requestId;
                if (request.method().toString() === "POST" && !control) {
                    control = true;
                    let url = new URL(request.url().toString());
                    token = url.searchParams.get("connectionToken");
                }
                if (postData) {
                    let prasedRequest = parseRequest(postData);
                    let action = prasedRequest?.A[0];
                    let wl = [12, 16, 10];
                    if (prasedRequest && wl.includes(action)) {
                        requestMap.set(requestId, postData);
                    }
                    if (action === 17 && token) handleRecall(prasedRequest);
                }
                request.continue();
            } catch (e) {
                console.log(e);
                request.continue();
            }
        });

        page.on("response", async (response) => {
            try {
                const request = response.request();
                if (response.url().includes("https://www.citieswar.com/signalr/send?transport=serverSentEvents")) {
                    let requestId = response.request()._requestId;
                    let originalRequest = requestMap.get(requestId);
                    if (originalRequest) {
                        const resp = await response.json();
                        handleInput(originalRequest, resp);
                        requestMap.clear(requestId);
                    }
                }
                if (request.url().includes("send?transport=serverSentEvents")) {
                    let url = new URL(request.url().toString());
                    token = url.searchParams.get("connectionToken");
                    let parsed = JSON.parse(await response.text());
                    if (parsed?.R?.ArmyList) {
                        parsed.R.ArmyList.forEach((item) => {
                            armies.set(item.ID, item);
                            if (item.DesLng) loadArmyState(item.ID, item);
                        });
                    }
                }
            } catch (e) {
                console.log(e);
            }
        });

        await page.goto("https://www.citieswar.com", {waitUntil: "networkidle0"});
        const cdp = await page.target().createCDPSession();
        await cdp.send("Network.enable");
        await cdp.send("Page.enable");
        let started = false
        await cdp.on("Network.eventSourceMessageReceived", async ({requestId, timestamp, eventName, eventId, data}) => {
            try {
                let parsed = JSON.parse(data);
                if (parsed && Object.keys(parsed).length > 0) console.log(data);
                if (parsed && parsed?.M && parsed?.M[0]?.M === "changeUnionCities") console.log("Blank");
                if (token && !started) {
                    started = true
                    console.log("running the loop")
                    await minesLoop(token);
                    console.log("DONE");
                }
            } catch {
            }
        });

        await page.type("#uid", login);
        await page.type("#pwd", pwd);
        await Promise.all([page.click("#signinplayer"), page.waitForNavigation({waitUntil: "networkidle0"})]);
    } catch (e) {
        console.log(e);
    }
}
async function minesLoop(token) {
    let cities = [
        {id: 2173, times: 5, type: 1},
        {id: 2357, times: 7, type: 2},
        {id: 932, times: 5, type: 3},
        {id: 72, times: 5, type: 4},
        {id: 3520, times: 5, type: 5},
    ];
    console.log("Building mines");
    for (let city in cities) {
        for (let i = 0; i < cities[city].times; i++) {
            await delay(3500);
            await buildMines(token, cities[city].id, cities[city].type);
        }
    }
    console.log("Doing gem hunt");
    await delay(2500);
    nonce = await getGemHunt(token, nonce);
    browser.close()
    return;
}