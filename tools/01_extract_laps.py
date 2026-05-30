import struct, re, glob, os, json
def chunks(f, tag):
    pat=b'\x3c\x68'+tag; out=[]; i=0
    while True:
        j=f.find(pat,i)
        if j<0: break
        size=struct.unpack('<I', f[j+6:j+10])[0]
        out.append(f[j+12:j+12+size]); i=j+2
    return out
def first(f,tag):
    c=chunks(f,tag); return c[0] if c else b''
sessions=[]
files=sorted(glob.glob(os.path.expanduser('~/Desktop/xrk/*XTreme*.xrk')))
for path in files:
    f=open(path,'rb').read()
    tmd=first(f,b'TMD').split(b'\x00')[0].decode('latin1','replace')
    tmt=first(f,b'TMT').split(b'\x00')[0].decode('latin1','replace')
    laps=[struct.unpack('<i', pl[4:8])[0] for pl in chunks(f,b'LAP') if len(pl)>=8]
    laps_s=[round(x/1000,3) for x in laps]
    flying=[x for x in laps_s if 40<=x<=80]   # plausible Shenzhen flying laps
    best=min(flying) if flying else None
    sessions.append(dict(file=os.path.basename(path), date=tmd, time=tmt, nlaps=len(laps_s), best=best, laps=laps_s))
sessions.sort(key=lambda s:(s['date'],s['time']))
json.dump(sessions, open('/tmp/xrk_sessions.json','w'), indent=1)
print(f"{len(sessions)} XTreme sessions")
print(f"{'date':10} {'time':8} {'n':>2} {'best':>6}  laps")
for s in sessions:
    print(f"{s['date']:10} {s['time']:8} {s['nlaps']:>2} {str(s['best']):>6}  {s['laps']}")
# overall best
allbest=[s['best'] for s in sessions if s['best']]
print("\nfastest flying lap overall:", min(allbest) if allbest else None)
print("distinct days:", sorted(set(s['date'] for s in sessions)))
