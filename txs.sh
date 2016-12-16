#!/bin/bash

# 公司的 WiFi 自动就可以翻墙，但是家里的 WiFi 就得自己设置；
# 这个脚本根据 WiFi 的 SSID 判断是否要设置翻墙代理（auto proxy）

NS="Wi-Fi"				# 网络类型

# 导入本地配置的翻墙代理，变量名称 ELEME_WIFI_SSID 和 TXS_PROXY_URL 都从该文件导入
echo $1
source "$HOME/.slh.conf"
toggleVPN(){
	if [[ "$1" == "off" ]]
		then
			networksetup -setautoproxyurl $NS " "
			networksetup -setautoproxystate $NS off
			echo "关闭 VPN 成功"
		else
			networksetup -setautoproxyurl $NS $TXS_PROXY_URL
			networksetup -setautoproxystate $NS on
			echo "开启 VPN 成功"
		fi
}
# WIFI_INFO 是一个包含 WiFi SSID 的字符串（也包含其他内容）
WIFI_INFO=`/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I`

if [[ "$1" == "on" ]]
	then
		echo "强制开"
		toggleVPN on
else
	if [[ "$1" == "off" ]]
		then
			echo "强制关"
			toggleVPN off
	else
		if [[ "$WIFI_INFO" == *"$ELEME_WIFI_SSID"* ]]
		then
			echo "公司网络，关闭"
			toggleVPN off
		else
			echo "非公司网络，打开"
			toggleVPN on
		fi
	fi
fi
