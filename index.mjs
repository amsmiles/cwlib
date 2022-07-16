const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
export const delay = async (ms) => await setTimeout(() => {}, [ms]);

let nonce = 0;
export let armies = new Map()
export let armyState = new Map()
export let armyStateClock = new Map()

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

export function setArmyState(army) {
    console.log(armyState);
    console.log("Getting the army", Number(army));
    let armyStateVal = armyState.get(Number(army));
    let armyObj = armies.get(Number(army));
    armyObj.Lat = armyStateVal.lat;
    armyObj.Lng = armyStateVal.lng;
    armyObj.DesCity = armyStateVal.city;
    armyObj.Status = 5;
    armies.set(army, armyObj);
    armyState.delete(army);
    console.log(armyState);
}

export function loadArmyState(army, armyObj) {
    console.log(`Found moving army ${army}`);
    armyState.set(Number(army), {
        city: Number(armyObj.DesCity),
        lat: Number(armyObj.DesLat),
        lng: Number(armyObj.DesLng),
    });
    let clock = setInterval(() => {
        let e = new Date(armyObj.StartTime);
        let f = ((new Date().getTime() - e.getTime()) / 1e3 / 3600) * Number(armyObj.Speed);
        if (f > Number(armyObj.Distance)) {
            console.log(`Your army ${army} has arrived.`);
            armyStateClock.delete(army);
            setArmyState(army);
            clearInterval(clock);
        }
    }, 200);
    armyStateClock.set(army, clock);
}

export function setArmies(rawResponse) {
    rawResponse.R.ArmyList.forEach((item) => {
        armies.set(item.ID, item);
        if (item.DesLng) loadArmyState(item.ID, item);
    });
}