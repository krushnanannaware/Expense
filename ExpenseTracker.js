const{useState,useEffect,useRef,useMemo,useCallback}=React;
const SK='fintrak_v1',TK='fintrak_theme';

const CATS=[
  {id:'income',label:'Income',icon:'💰',color:'#10b981'},
  {id:'food',label:'Food',icon:'🍔',color:'#f59e0b'},
  {id:'travel',label:'Travel',icon:'✈️',color:'#3b82f6'},
  {id:'bills',label:'Bills',icon:'📋',color:'#ef4444'},
  {id:'shopping',label:'Shopping',icon:'🛍️',color:'#8b5cf6'},
  {id:'entertainment',label:'Entertainment',icon:'🎬',color:'#ec4899'},
  {id:'health',label:'Health',icon:'💊',color:'#22c55e'},
  {id:'education',label:'Education',icon:'📚',color:'#06b6d4'},
  {id:'other',label:'Other',icon:'📌',color:'#94a3b8'},
];

const SEED=[
  {id:'s1',text:'Monthly Salary',amount:85000,cat:'income',date:'2026-04-01',note:''},
  {id:'s2',text:'Apartment Rent',amount:-22000,cat:'bills',date:'2026-04-03',note:'April rent'},
  {id:'s3',text:'Grocery Shopping',amount:-3200,cat:'food',date:'2026-04-05',note:''},
  {id:'s4',text:'Netflix & Spotify',amount:-849,cat:'entertainment',date:'2026-04-06',note:''},
  {id:'s5',text:'Freelance Project',amount:25000,cat:'income',date:'2026-04-10',note:'Website'},
  {id:'s6',text:'Flight to Goa',amount:-8500,cat:'travel',date:'2026-04-12',note:''},
  {id:'s7',text:'Doctor Visit',amount:-800,cat:'health',date:'2026-04-15',note:''},
  {id:'s8',text:'Amazon Shopping',amount:-4200,cat:'shopping',date:'2026-04-17',note:''},
  {id:'s9',text:'Electricity Bill',amount:-1850,cat:'bills',date:'2026-04-18',note:''},
  {id:'s10',text:'Udemy Course',amount:-999,cat:'education',date:'2026-04-19',note:''},
  {id:'s11',text:'March Salary',amount:85000,cat:'income',date:'2026-03-01',note:''},
  {id:'s12',text:'March Rent',amount:-22000,cat:'bills',date:'2026-03-03',note:''},
  {id:'s13',text:'Dining Out',amount:-2800,cat:'food',date:'2026-03-10',note:''},
  {id:'s14',text:'Gym Membership',amount:-2500,cat:'health',date:'2026-03-15',note:''},
  {id:'s15',text:'Feb Salary',amount:85000,cat:'income',date:'2026-02-01',note:''},
  {id:'s16',text:'Feb Rent',amount:-22000,cat:'bills',date:'2026-02-03',note:''},
  {id:'s17',text:'Restaurant',amount:-3500,cat:'food',date:'2026-02-14',note:''},
];

const fmt=n=>'₹'+Math.abs(n).toLocaleString('en-IN');
const load=()=>{try{const s=localStorage.getItem(SK);return s?JSON.parse(s):null}catch{return null}};
const persist=d=>localStorage.setItem(SK,JSON.stringify(d));

function exportCSV(txns){
  const rows=[['Date','Title','Category','Amount','Note'],
    ...txns.map(t=>[t.date,`"${t.text}"`,CATS.find(c=>c.id===t.cat)?.label||t.cat,t.amount,`"${t.note||''}"`])];
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));
  a.download=`expenses-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

function DonutChart({txns,theme}){
  const ref=useRef(),inst=useRef();
  const data=useMemo(()=>{
    const g={};txns.filter(t=>t.amount<0).forEach(t=>g[t.cat]=(g[t.cat]||0)+Math.abs(t.amount));return g;
  },[txns]);
  useEffect(()=>{
    if(!ref.current)return;
    if(inst.current){inst.current.destroy();inst.current=null;}
    const cats=Object.keys(data);
    if(!cats.length)return;
    const dark=theme==='dark';
    inst.current=new Chart(ref.current,{
      type:'doughnut',
      data:{labels:cats.map(c=>CATS.find(x=>x.id===c)?.label||'Other'),
        datasets:[{data:cats.map(c=>data[c]),backgroundColor:cats.map(c=>CATS.find(x=>x.id===c)?.color||'#94a3b8'),borderWidth:2,borderColor:dark?'#131927':'#fff'}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'68%',
        plugins:{legend:{position:'bottom',labels:{color:dark?'#8892a4':'#64748b',padding:10,font:{family:'Inter',size:11},boxWidth:10,boxHeight:10}},
          tooltip:{callbacks:{label:ctx=>` ${fmt(ctx.raw)}`}}}}
    });
    return()=>{if(inst.current){inst.current.destroy();inst.current=null;}};
  },[data,theme]);
  if(!Object.keys(data).length)return <div className="chart-empty">No expenses yet</div>;
  return <div style={{height:'220px',position:'relative'}}><canvas ref={ref}/></div>;
}

function BarChart({txns,theme}){
  const ref=useRef(),inst=useRef();
  const months=useMemo(()=>{
    const now=new Date(),res=[];
    for(let i=5;i>=0;i--){
      const d=new Date(now.getFullYear(),now.getMonth()-i,1);
      const yr=d.getFullYear(),mo=d.getMonth();
      const mt=txns.filter(t=>{const td=new Date(t.date);return td.getFullYear()===yr&&td.getMonth()===mo;});
      res.push({label:d.toLocaleString('default',{month:'short'}),
        income:mt.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0),
        expense:mt.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0)});
    }return res;
  },[txns]);
  useEffect(()=>{
    if(!ref.current)return;
    if(inst.current){inst.current.destroy();inst.current=null;}
    const dark=theme==='dark';
    const gc=dark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.05)';
    const tc=dark?'#8892a4':'#64748b';
    inst.current=new Chart(ref.current,{
      type:'bar',
      data:{labels:months.map(m=>m.label),
        datasets:[
          {label:'Income',data:months.map(m=>m.income),backgroundColor:'rgba(16,185,129,0.8)',borderRadius:5,borderSkipped:false},
          {label:'Expense',data:months.map(m=>m.expense),backgroundColor:'rgba(239,68,68,0.75)',borderRadius:5,borderSkipped:false}
        ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'bottom',labels:{color:tc,padding:10,font:{family:'Inter',size:11},boxWidth:10,boxHeight:10}},
          tooltip:{callbacks:{label:ctx=>` ${ctx.dataset.label}: ${fmt(ctx.raw)}`}}},
        scales:{
          x:{grid:{color:gc},ticks:{color:tc,font:{family:'Inter',size:11}},border:{display:false}},
          y:{grid:{color:gc},ticks:{color:tc,font:{family:'Inter',size:11},callback:v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`},border:{display:false}}
        }}
    });
    return()=>{if(inst.current){inst.current.destroy();inst.current=null;}};
  },[months,theme]);
  return <div style={{height:'220px',position:'relative'}}><canvas ref={ref}/></div>;
}

function useInsights(txns){
  return useMemo(()=>{
    const now=new Date(),cm=now.getMonth(),cy=now.getFullYear();
    const pm=cm===0?11:cm-1,py=cm===0?cy-1:cy;
    const curr=txns.filter(t=>{const d=new Date(t.date);return d.getFullYear()===cy&&d.getMonth()===cm;});
    const prev=txns.filter(t=>{const d=new Date(t.date);return d.getFullYear()===py&&d.getMonth()===pm;});
    const cSpend=curr.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const pSpend=prev.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
    const cIncome=curr.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
    const catG={};curr.filter(t=>t.amount<0).forEach(t=>catG[t.cat]=(catG[t.cat]||0)+Math.abs(t.amount));
    const top=Object.entries(catG).sort((a,b)=>b[1]-a[1])[0];
    const sav=cIncome>0?Math.round((cIncome-cSpend)/cIncome*100):0;
    const ins=[];
    if(top){const c=CATS.find(x=>x.id===top[0]);ins.push({type:'info',text:`${c?.icon} Top spend: ${c?.label} — ${fmt(top[1])} this month`});}
    if(pSpend>0&&cSpend>0){const p=Math.round((cSpend-pSpend)/pSpend*100);ins.push({type:p>0?'warn':'good',text:`${p>0?'⚠️':'✅'} Spending ${Math.abs(p)}% ${p>0?'higher':'lower'} than last month`});}
    if(cIncome>0)ins.push({type:sav>=20?'good':'warn',text:`${sav>=20?'🎯':'💡'} Savings rate: ${sav}%${sav<20?' — aim for 20%+':' — great job!'}`});
    return ins;
  },[txns]);
}

function Toast({toast}){
  if(!toast)return null;
  return <div className={`toast toast-${toast.type}`}>{toast.msg}</div>;
}

function TxnModal({modal,onClose,onSave}){
  const init=modal.data||{text:'',amount:'',cat:'food',date:new Date().toISOString().slice(0,10),note:''};
  const[form,setForm]=useState(init);
  const inp=useRef();
  useEffect(()=>{inp.current?.focus();},[]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=e=>{
    e.preventDefault();
    if(!form.text.trim()||!form.amount)return;
    onSave({...form,amount:+form.amount,id:modal.data?.id||Date.now().toString()});
  };
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{modal.data?'Edit Transaction':'Add Transaction'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="modal-form">
          <div className="field"><label>Title</label>
            <input ref={inp} value={form.text} onChange={e=>set('text',e.target.value)} placeholder="e.g. Grocery run" required/>
          </div>
          <div className="field-row">
            <div className="field"><label>Amount</label>
              <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="+5000 or -1200" required/>
            </div>
            <div className="field"><label>Date</label>
              <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} required/>
            </div>
          </div>
          <div className="field"><label>Category</label>
            <div className="cat-grid">
              {CATS.map(c=>(
                <button type="button" key={c.id}
                  className={`cat-btn${form.cat===c.id?' active':''}`}
                  style={form.cat===c.id?{borderColor:c.color,background:c.color+'22'}:{}}
                  onClick={()=>set('cat',c.id)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label>Note (optional)</label>
            <input value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Add a note..."/>
          </div>
          <button type="submit" className="btn-primary">{modal.data?'Save Changes':'Add Transaction'}</button>
        </form>
      </div>
    </div>
  );
}

function TxnItem({item,onEdit,onDelete}){
  const[confirm,setConfirm]=useState(false);
  const cat=CATS.find(c=>c.id===item.cat)||CATS.at(-1);
  const isExp=item.amount<0;
  return(
    <div className="txn-item">
      <div className="txn-icon" style={{background:cat.color+'22',color:cat.color}}>{cat.icon}</div>
      <div className="txn-info">
        <span className="txn-title">{item.text}</span>
        <span className="txn-meta">{cat.label} · {new Date(item.date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}{item.note&&` · ${item.note}`}</span>
      </div>
      <span className={`txn-amount ${isExp?'neg':'pos'}`}>{isExp?'−':'+​'}{fmt(item.amount)}</span>
      <div className="txn-actions">
        {confirm
          ?<><button className="act-btn danger" onClick={()=>onDelete(item.id)}>Yes</button><button className="act-btn" onClick={()=>setConfirm(false)}>No</button></>
          :<><button className="act-btn" onClick={()=>onEdit(item)} title="Edit">✏️</button><button className="act-btn danger" onClick={()=>setConfirm(true)} title="Delete">🗑️</button></>
        }
      </div>
    </div>
  );
}

function App(){
  const[theme,setTheme]=useState(()=>localStorage.getItem(TK)||'dark');
  const[txns,setTxns]=useState(()=>load()||SEED);
  const[filter,setFilter]=useState({cat:'all',q:'',month:'all'});
  const[modal,setModal]=useState(null);
  const[toast,setToast]=useState(null);

  useEffect(()=>{document.documentElement.setAttribute('data-theme',theme);localStorage.setItem(TK,theme);},[theme]);
  useEffect(()=>{persist(txns);},[txns]);

  const showToast=useCallback((msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3000);},[]);

  const addOrEdit=useCallback(form=>{
    setTxns(prev=>{
      const exists=prev.find(t=>t.id===form.id);
      return exists?prev.map(t=>t.id===form.id?form:t):[form,...prev];
    });
    showToast(modal?.data?'Transaction updated ✓':'Transaction added ✓');
    setModal(null);
  },[modal,showToast]);

  const del=useCallback(id=>{setTxns(p=>p.filter(t=>t.id!==id));showToast('Deleted','warn');},[showToast]);

  const filtered=useMemo(()=>txns.filter(t=>{
    if(filter.cat!=='all'&&t.cat!==filter.cat)return false;
    if(filter.q&&!t.text.toLowerCase().includes(filter.q.toLowerCase()))return false;
    if(filter.month!=='all'){const d=new Date(t.date),ym=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;if(ym!==filter.month)return false;}
    return true;
  }),[txns,filter]);

  const total=useMemo(()=>txns.reduce((s,t)=>s+t.amount,0),[txns]);
  const income=useMemo(()=>txns.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0),[txns]);
  const expense=useMemo(()=>txns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0),[txns]);
  const insights=useInsights(txns);

  const months=useMemo(()=>{
    const s=new Set(txns.map(t=>{const d=new Date(t.date);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}));
    return[...[...s].sort().reverse()];
  },[txns]);

  const sf=k=>v=>setFilter(f=>({...f,[k]:v}));

  return(
    <div className="app">
      <header className="header">
        <div className="logo">💎 Fintrak</div>
        <div className="header-actions">
          <button className="icon-btn" onClick={()=>exportCSV(txns)}>⬇ CSV</button>
          <button className="icon-btn" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}>{theme==='dark'?'☀️ Light':'🌙 Dark'}</button>
        </div>
      </header>

      <main className="main">
        <div className="stat-cards">
          <div className="stat-card">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value" style={{color:total>=0?'#10b981':'#ef4444'}}>{total<0?'−':''}{fmt(total)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">↑ Total Income</div>
            <div className="stat-value green">{fmt(income)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">↓ Total Expenses</div>
            <div className="stat-value red">{fmt(expense)}</div>
          </div>
        </div>

        {insights.length>0&&(
          <div className="insights">
            {insights.map((ins,i)=><div key={i} className={`insight insight-${ins.type}`}>{ins.text}</div>)}
          </div>
        )}

        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-title">Category Breakdown</div>
            <DonutChart txns={txns} theme={theme}/>
          </div>
          <div className="chart-card">
            <div className="chart-title">Monthly Trends (6 months)</div>
            <BarChart txns={txns} theme={theme}/>
          </div>
        </div>

        <div className="txn-section">
          <div className="section-header">
            <h3>Transactions <span className="count">{filtered.length}</span></h3>
            <button className="btn-add" onClick={()=>setModal({data:null})}>+ Add</button>
          </div>
          <div className="filter-bar">
            <input className="search" placeholder="🔍 Search..." value={filter.q} onChange={e=>sf('q')(e.target.value)}/>
            <select className="filter-select" value={filter.cat} onChange={e=>sf('cat')(e.target.value)}>
              <option value="all">All categories</option>
              {CATS.map(c=><option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
            <select className="filter-select" value={filter.month} onChange={e=>sf('month')(e.target.value)}>
              <option value="all">All months</option>
              {months.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="txn-list">
            {filtered.length===0
              ?<div className="empty-state"><div className="emoji">🪙</div><p>No transactions found.</p></div>
              :filtered.map(item=><TxnItem key={item.id} item={item} onEdit={item=>setModal({data:item})} onDelete={del}/>)
            }
          </div>
        </div>
      </main>

      {modal&&<TxnModal modal={modal} onClose={()=>setModal(null)} onSave={addOrEdit}/>}
      <Toast toast={toast}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);