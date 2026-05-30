import json, datetime, statistics
D=json.load(open('/tmp/shenzhen_data.json'))
d0=datetime.date(2026,3,30)
for o in D:
    y,m,dd=map(int,o['date'].split('-')); o['day']=(datetime.date(y,m,dd)-d0).days
    o['wetReal']= o['precip']>=0.4
# dry-ish, real sessions only (>=4 laps so 'best' is a true flying lap)
dryish=[o for o in D if not o['wetReal'] and o['n']>=4]
# per-day fastest (one point/day) to avoid weighting busy days
byday={}
for o in dryish: byday.setdefault(o['day'],[]).append(o['best'])
pts=sorted((day,min(v)) for day,v in byday.items())
def fit(P):
    n=len(P); sx=sum(d for d,_ in P); sy=sum(b for _,b in P)
    sxx=sum(d*d for d,_ in P); sxy=sum(d*b for d,b in P)
    b=(n*sxy-sx*sy)/(n*sxx-sx*sx); a=(sy-b*sx)/n; return a,b
# robust: fit, drop points >1.5s above line (off-days/other kart), refit
a,b=fit(pts)
for _ in range(3):
    keep=[(d,v) for d,v in pts if v-(a+b*d) <= 1.5]
    if len(keep)<3: break
    a,b=fit(keep)
limit=lambda day:a+b*day
maxday=max(o['day'] for o in D)
kept=[(d,v) for d,v in pts if v-(a+b*d)<=1.5]
drop=[(d,v) for d,v in pts if v-(a+b*d)>1.5]
print(f"per-day dry points: {len(pts)} | kept {len(kept)} | dropped off-days: {[(d,round(v,1)) for d,v in drop]}")
print(f"improvement {b*7:+.2f} s/week | personal dry limit start {limit(0):.2f}s -> now {limit(maxday):.2f}s")
print(f"fastest clean lap ever: {min(v for _,v in pts):.3f}s | projected in 4 wks: {limit(maxday+28):.2f}s")
# wet penalty from real-wet sessions vs fitted dry limit that day
print("\nWET sessions vs personal dry limit (real time lost to grip):")
for o in sorted([o for o in D if o['wetReal'] and o['n']>=4],key=lambda o:o['day']):
    L=limit(o['day']); print(f"  {o['dt']}  grip {o['grip']:.2f}  best {o['best']:.2f}  dry-limit {L:.2f}  +{o['best']-L:.2f}s (+{100*(o['best']/L-1):.1f}%)")
# embed: keep real sessions (n>=4) only; flag wet + offday
emb=[]
for o in sorted([o for o in D if o['n']>=4],key=lambda o:o['day']):
    off = (not o['wetReal']) and (o['best']-limit(o['day'])>1.5)
    emb.append(dict(d=o['date'],best=round(o['best'],2),n=o['n'],grip=o['grip'],score=o['score'],wet=1 if o['wetReal'] else 0,off=1 if off else 0,temp=o['temp']))
model=dict(d0='2026-03-30',a=round(a,3),b=round(b,5),limitNow=round(limit(maxday),2),fastest=round(min(v for _,v in pts),3),cornerFrac=0.62,track='Shenzhen Xtreme Speedway',cls='IAME X30 Senior',lat=22.7117,lon=113.8654)
json.dump(dict(model=model,sessions=emb), open('/tmp/shenzhen_personal.json','w'))
print(f"\nembedded {len(emb)} real sessions; model limitNow={model['limitNow']}s fastest={model['fastest']}s")
