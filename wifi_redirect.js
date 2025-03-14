let wifiSSID = $network.wifi.ssid;
if (wifiSSID === "10-602") {
    $done({ host: "192.168.10.2" });
} else {
    $done({});
}
