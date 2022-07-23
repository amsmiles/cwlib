const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
export const delay = async (ms) => await setTimeout(() => {
}, [ms]);

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

export function parseRequest(data) {
    try {
        return JSON.parse(decodeURIComponent(data).split("data=")[1]);
    } catch {
        return undefined;
    }
}

export async function postToDiscord(hook, params) {
    var URL = `https://discord.com/api/webhooks/${hook}`;
    await fetch(URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(params),
    });
}

export class cwBot {
    HOOK_URL = null;
    DISCORD_TOKEN = null;
    nonce = 0;
    armies = new Map()
    armyState = new Map()
    armyStateClock = new Map()
    rss = []

    constructor() {
    }

    constructor(_HOOK_URL, _DISCORD_TOKEN) {
        this.HOOK_URL = _HOOK_URL;
        this.DISCORD_TOKEN = _DISCORD_TOKEN
    }

    getNonce() {
        return this.nonce
    }

    setNonce(nonce) {
        this.nonce = nonce
    }

    getArmies() {
        return this.armies
    }

    getArmyState() {
        return this.armyState
    }

    async getGemHunt(token, tries = 0) {
        this.nonce++;
        let gemInfo = await fetch(
            `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
                token
            )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
            {
                headers: headers,
                referrer: "https://www.citieswar.com/main",
                referrerPolicy: "strict-origin-when-cross-origin",
                body: `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B33%2C%22%22%5D%2C%22I%22%3A${this.nonce}%7D`,
                method: "POST",
                mode: "cors",
                credentials: "include",
            }
        )
            .then((res) => res.json())
            .then((res) => res);
        this.nonce++;
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
                body: `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B34%2C${gemInfo.R.LeftGemsCount}%5D%2C%22I%22%3A${this.nonce}%7D`,
                method: "POST",
                mode: "cors",
                credentials: "include",
            }
        )
            .then((res) => res.json())
            .then((res) => res);
        if (gemHunt?.R?.GemsResult !== 2 && tries < 6) await this.getGemHunt(token, tries + 1);
        console.log("Gem hunt result");
        console.table(gemHunt);
    }

    async buildMines(token, mineid, type, tries = 0) {
        this.nonce++;
        let res = await fetch(
            `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
                token
            )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
            {
                headers: headers,
                referrer: "https://www.citieswar.com/main",
                referrerPolicy: "strict-origin-when-cross-origin",
                body: `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B8%2C%22${mineid}%26${type}%260%22%5D%2C%22I%22%3A${this.nonce}%7D`,
                method: "POST",
                mode: "cors",
                credentials: "include",
            }
        )
            .then((res) => res.json())
            .then((res) => res)
            .catch((err) => console.log(err));
        await delay(1000);
        return res
    }

    async donateToBank(token, amount) {
        let res = await fetch(
            `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
                token
            )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
            {
                headers: headers,
                "referrer": "https://www.citieswar.com/main",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B78%2C${amount}%5D%2C%22I%22%3A8%7D`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
            .then(res => res.json())
            .then(res => res);
    }

    async sellResource(token, amount, id) {
        let res = await fetch(
            `https://www.citieswar.com/signalr/send?transport=serverSentEvents&connectionToken=${encodeURIComponent(
                token
            )}&connectionData=%5B%7B%22name%22%3A%22alexh%22%7D%5D`,
            {
                headers: headers,
                "referrer": "https://www.citieswar.com/main",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `data=%7B%22H%22%3A%22alexh%22%2C%22M%22%3A%22call%22%2C%22A%22%3A%5B6%2C%22${id}%26${amount}%22%5D%2C%22I%22%3A1%7D`,
                "method": "POST",
                "mode": "cors",
                "credentials": "include"
            })
            .then((res) => res.json())
            .then((res) => res);

    }

    setArmyState(army) {
        console.log(this.armyState);
        console.log("Getting the army", Number(army));
        let armyStateVal = this.armyState.get(Number(army));
        let armyObj = this.armies.get(Number(army));
        armyObj.Lat = armyStateVal.lat;
        armyObj.Lng = armyStateVal.lng;
        armyObj.DesCity = armyStateVal.city;
        armyObj.Status = 5;
        this.armies.set(army, armyObj);
        this.armyState.delete(army);
        console.log(this.armyState);
    }

    loadArmyState(army, armyObj) {
        console.log(`Found moving army ${army}`);
        this.armyState.set(Number(army), {
            city: Number(armyObj.DesCity),
            lat: Number(armyObj.DesLat),
            lng: Number(armyObj.DesLng),
        });
        let clock = setInterval(() => {
            let e = new Date(armyObj.StartTime);
            let f = ((new Date().getTime() - e.getTime()) / 1e3 / 3600) * Number(armyObj.Speed);
            if (f > Number(armyObj.Distance)) {
                console.log(`Your army ${army} has arrived.`);
                this.armyStateClock.delete(army);
                this.setArmyState(army);
                clearInterval(clock);
            }
        }, 200);
        this.armyStateClock.set(army, clock);
    }

    setResources(rawResponce) {
        this.rss = rawResponce.R.resources
    }

    setArmies(rawResponse) {
        rawResponse.R.ArmyList.forEach((item) => {
            this.armies.set(item.ID, item);
            if (item.DesLng) this.loadArmyState(item.ID, item);
        });
    }

    async handleWc(message) {
        let params;
        if (message.M[0]["A"].length <= 11) {
            let tuple = message.M[0]["A"];
            let author = tuple[1];
            let date = tuple[2];
            let content = tuple[3];
            let profile = `https://www.citieswar.com/images/avatar/${tuple[5]}.jpg`;
            let alliance = tuple[6];
            let allianceId = tuple[7];
            let playerId = tuple[5];
            this.updatePlayers(playerId, author);
            this.updateAlliances(allianceId, alliance);
            let msg = decodeEntities(content);
            console.log(msg);
            params = {
                username: `[${
                    alliance
                        ? alliances
                            .get(allianceId)
                            .toString()
                            .replace(/ +(?= )/g, "")
                        : ""
                }] ${author}`,
                avatar_url: profile,
            };
            try {
                params.content = msg
                    .replace(new RegExp("@Test", "ig"), "I am an idiot")
                    .replace(new RegExp("@here", "ig"), "I am an idiot")
                    .replace(new RegExp("@everyone", "ig"), "I am an idiot");
            } catch {
                params.content = msg;
            }
        } else {
            console.log("=============================ERROR=============================");
            console.log(message);
            console.log(message.M[0]["A"]);
            console.log("=============================ERROR=============================");
        }
        await this.postToDiscord(this.HOOK_URL, params);
    }

}





