import json
S=json.load(open('/tmp/xrk_sessions.json'))
H=json.load(open('/tmp/archive.json'))['hourly']
idx={t:i for i,t in enumerate(H['time'])}
def clamp(x,lo=0,hi=1): return max(lo,min(hi,x))
WET={0:0,1:0,2:0,3:0,45:.2,48:.2,51:.5,53:.6,55:.75,56:.9,57:.95,61:.7,63:.85,65:1,66:.95,67:1,71:.9,73:.95,75:1,77:.85,80:.7,81:.85,82:1,85:.95,86:1,95:1,96:1,99:1}
def score(temp,feels,wind,gust,precip,code):
    wet=WET.get(int(code),.3)
    grip=1-wet*0.85
    if precip>0.1: grip-=min(precip/8,0.3)
    if temp<5: grip-=(5-temp)*0.03
    if temp>32: grip-=(temp-32)*0.02
    grip=clamp(grip)
    pace=(0.35*(1-wet)+0.15) if wet>0.4 else 1-abs(temp-12)/28
    pace-=min(max((gust or wind)-25,0)/60,0.25); pace=clamp(pace)
    comfort=clamp(1-abs(feels-21)/26-wet*0.6-min(wind/70,0.3))
    s10=round(clamp(grip*0.5+pace*0.28+comfort*0.22)*100)/10
    return s10,round(grip,3),round(pace,3),round(comfort,3),round(wet,2)
out=[]
for s in S:
    if s['date']=='01/01/2005' or not s['best']: continue
    mm,dd,yy=s['date'].split('/'); hh=s['time'][:2]
    key=f"{yy}-{mm}-{dd}T{hh}:00"
    if key not in idx: continue
    i=idx[key]; gg=lambda k:H[k][i]
    s10,grip,pace,comfort,wet=score(gg('temperature_2m'),gg('apparent_temperature'),gg('wind_speed_10m'),gg('wind_gusts_10m'),gg('precipitation'),gg('weather_code'))
    flying=sorted(x for x in s['laps'] if 40<=x<=80)
    out.append(dict(dt=f"{yy}-{mm}-{dd} {s['time'][:5]}", date=f"{yy}-{mm}-{dd}", best=s['best'],
        med=flying[len(flying)//2] if flying else None, n=len(flying),
        temp=round(gg('temperature_2m'),1), precip=round(gg('precipitation'),2), code=int(gg('weather_code')),
        wind=round(gg('wind_speed_10m')), wet=wet, grip=grip, pace=pace, score=s10))
out.sort(key=lambda o:o['dt'])
json.dump(out, open('/tmp/shenzhen_data.json','w'), indent=1)
print(f"{len(out)} sessions paired\n{'datetime':16} {'best':>6} {'n':>2} {'temp':>5} {'rain':>5} {'wet':>4} {'grip':>5} {'score':>5}")
for o in out:
    print(f"{o['dt']:16} {o['best']:>6} {o['n']:>2} {o['temp']:>5} {o['precip']:>5} {o['wet']:>4} {o['grip']:>5} {o['score']:>5}")
