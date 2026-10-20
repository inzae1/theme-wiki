'use strict';
// Hidden GAME tuning. Editorial character interpretations, not measured psychological traits.
// No trait scores or labels are rendered in profiles, tooltips, status panels, or results.
const survivalPersonality=[
 {patience:42,leadership:58,humor:84,competitive:86,spontaneity:64,care:58,thrift:62,stamina:57,assertiveness:82,curiosity:55},
 {patience:34,leadership:48,humor:88,competitive:85,spontaneity:58,care:52,thrift:72,stamina:43,assertiveness:87,curiosity:52},
 {patience:65,leadership:66,humor:72,competitive:77,spontaneity:48,care:72,thrift:66,stamina:60,assertiveness:70,curiosity:70},
 {patience:66,leadership:84,humor:80,competitive:78,spontaneity:76,care:76,thrift:49,stamina:92,assertiveness:72,curiosity:80},
 {patience:58,leadership:78,humor:91,competitive:80,spontaneity:67,care:70,thrift:61,stamina:82,assertiveness:78,curiosity:82},
 {patience:62,leadership:64,humor:55,competitive:66,spontaneity:37,care:67,thrift:79,stamina:60,assertiveness:65,curiosity:62},
 {patience:55,leadership:77,humor:87,competitive:83,spontaneity:80,care:68,thrift:52,stamina:65,assertiveness:69,curiosity:65},
 {patience:54,leadership:49,humor:58,competitive:82,spontaneity:58,care:62,thrift:65,stamina:65,assertiveness:73,curiosity:59},
 {patience:76,leadership:55,humor:40,competitive:75,spontaneity:32,care:69,thrift:78,stamina:58,assertiveness:57,curiosity:64},
 {patience:40,leadership:45,humor:75,competitive:87,spontaneity:65,care:56,thrift:69,stamina:53,assertiveness:82,curiosity:56},
 {patience:48,leadership:67,humor:64,competitive:74,spontaneity:57,care:75,thrift:57,stamina:58,assertiveness:87,curiosity:60},
 {patience:60,leadership:83,humor:58,competitive:57,spontaneity:90,care:67,thrift:46,stamina:65,assertiveness:75,curiosity:91}
];
const survivalCities={
 seoul:{name:'서울',lat:37.566,lon:126.9784,geonames:1835848},incheon:{name:'인천',lat:37.45646,lon:126.70515,geonames:1843564},gwangmyeong:{name:'광명',lat:37.47722,lon:126.86639,geonames:1948005},asan:{name:'아산',lat:36.78361,lon:127.00417,geonames:1839726},daejeon:{name:'대전',lat:36.34913,lon:127.38493,geonames:1835235},jincheon:{name:'진천',lat:36.85667,lon:127.44333,geonames:1846095},gumi:{name:'구미',lat:36.1136,lon:128.336,geonames:1842225},uljin:{name:'울진',lat:36.99294,lon:129.39999,geonames:1833763},jecheon:{name:'제천',lat:37.13611,lon:128.21194,geonames:1846278},changwon:{name:'창원',lat:35.22806,lon:128.68111,geonames:1846326},namyangju:{name:'남양주',lat:37.63667,lon:127.21417,geonames:1897122},gangneung:{name:'강릉',lat:37.75266,lon:128.87239,geonames:1843137},busan:{name:'부산',lat:35.10168,lon:129.03004,geonames:1838524},jeonju:{name:'전주',lat:35.82194,lon:127.14889,geonames:1845457}
};
const survivalHomes=['jecheon','incheon','gumi','seoul','gwangmyeong','daejeon','asan','uljin','namyangju','incheon','jincheon','changwon'];
