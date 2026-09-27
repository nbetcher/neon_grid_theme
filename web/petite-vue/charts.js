/* charts.js — Neon Grid / Chart.js v4 adapter + 5 builders. Global, non-module.
   Load AFTER chart.umd.min.js and data.js, BEFORE app.js. Defines globals; does NOT auto-build. */
(function(global){
  'use strict';
  if(!global.Chart){ console.error('[neon] Chart.js not loaded'); return; }
  var C = global.Chart;

  var NEON = { cyan:'#00E0FF', green:'#00FF95', fuchsia:'#FF2DAA', orange:'#FF9500',
    blue:'#1F9BFF', violet:'#8A45FF', red:'#FF3B5C', yellow:'#FFE11A',
    slate:'#62749C', text:'#EAF0FB', textDim:'#9FB0D6', panel:'#111125', void:'#0A0A12' };
  var SPECTRUM = [NEON.cyan,NEON.fuchsia,NEON.green,NEON.orange,NEON.violet,NEON.blue,NEON.yellow,NEON.red];
  var SEV = { critical:NEON.red, high:NEON.orange, medium:NEON.yellow, low:NEON.cyan, cleanup:NEON.slate }; // canonical §5.2

  function hexA(hex,a){ if(!hex) return 'rgba(98,116,156,'+a+')'; var h=hex.replace('#','');
    if(h.length===3) h=h.split('').map(function(c){return c+c;}).join(''); var n=parseInt(h,16);
    return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
  function gradientFill(ctx,area,hex,topA){ if(!area) return hexA(hex,0.25);
    var g=ctx.createLinearGradient(0,area.top,0,area.bottom);
    g.addColorStop(0,hexA(hex, topA==null?0.45:topA)); g.addColorStop(1,hexA(hex,0)); return g; }

  // ---- global defaults ----
  C.defaults.font.family="'Orbitron', sans-serif"; C.defaults.font.size=11; C.defaults.font.weight=600;
  C.defaults.color=NEON.textDim; C.defaults.borderColor=hexA(NEON.cyan,0.06);
  C.defaults.maintainAspectRatio=false;
  C.defaults.plugins.legend.labels.color=NEON.textDim;
  C.defaults.plugins.legend.labels.usePointStyle=true;
  C.defaults.plugins.legend.labels.boxWidth=8; C.defaults.plugins.legend.labels.boxHeight=8;
  Object.assign(C.defaults.plugins.tooltip,{ backgroundColor:hexA(NEON.panel,0.95),
    borderColor:hexA(NEON.cyan,0.5), borderWidth:1, titleColor:NEON.cyan, bodyColor:NEON.text,
    padding:10, cornerRadius:6, titleFont:{family:"'Share Tech Mono', monospace",size:12},
    bodyFont:{family:"'Share Tech Mono', monospace",size:12}, displayColors:true, boxPadding:4 });
  C.defaults.scale.grid.color=hexA(NEON.cyan,0.06); C.defaults.scale.grid.tickColor=hexA(NEON.cyan,0.12);
  C.defaults.scale.border.color=hexA(NEON.violet,0.18); C.defaults.scale.ticks.color=NEON.textDim;

  // ---- NeonGlow plugin: doughnut/pie bloom from backgroundColor (NOT the dark gap border) ----
  var NeonGlow = { id:'neonGlow',
    beforeDatasetDraw:function(chart,args){ var ds=chart.data.datasets[args.index]||{};
      if(ds.neonGlow===false) return;
      var type=ds.type||chart.config.type;
      var col=ds.neonGlowColor;
      if(!col){ col=(type==='doughnut'||type==='pie') ? ds.backgroundColor : (ds.borderColor||ds.backgroundColor); }
      if(Array.isArray(col)) col=col[0];
      if(typeof col!=='string') col=NEON.cyan;
      var ctx=chart.ctx; ctx.save(); ctx.shadowColor=col; ctx.shadowBlur=(ds.neonGlow==null?12:ds.neonGlow); },
    afterDatasetDraw:function(chart,args){ var ds=chart.data.datasets[args.index]||{};
      if(ds.neonGlow===false) return; chart.ctx.restore(); } };
  C.register(NeonGlow);

  global.NeonChart = { NEON:NEON, SPECTRUM:SPECTRUM, SEV:SEV, hexA:hexA, gradientFill:gradientFill };

  // ================= builders =================
  var instances = {};
  function mk(id,cfg){ var el=document.getElementById(id); if(!el) return null;
    var c=new C(el,cfg); c.update('none'); return c; }              // update('none') => gradients paint on first frame

  function sparkline(id,series,hex){ return mk(id,{ type:'line',
    data:{ labels:series.map(function(_,i){return i;}), datasets:[{ data:series, borderColor:hex,
      borderWidth:2, tension:0.4, pointRadius:0, neonGlow:8, fill:'origin',
      backgroundColor:function(c){return gradientFill(c.chart.ctx,c.chart.chartArea,hex,0.35);} }] },
    options:{ responsive:true, plugins:{legend:{display:false},tooltip:{enabled:false}},
      scales:{x:{display:false},y:{display:false,beginAtZero:true}}, layout:{padding:2} } }); }

  function buildTrend(){ var t=global.NG_DATA.charts.findingsWeekly; // [{week,opened,resolved}]
    return mk('chart-trend',{ type:'line',
      data:{ labels:t.map(function(d){return d.week;}), datasets:[
        { label:'Opened', data:t.map(function(d){return d.opened;}), borderColor:NEON.fuchsia,
          borderWidth:2.5, tension:0.4, pointRadius:0, pointHoverRadius:5, neonGlow:14, fill:'origin',
          backgroundColor:function(c){return gradientFill(c.chart.ctx,c.chart.chartArea,NEON.fuchsia,0.4);} },
        { label:'Resolved', data:t.map(function(d){return d.resolved;}), borderColor:NEON.green,
          borderWidth:2.5, tension:0.4, pointRadius:0, pointHoverRadius:5, neonGlow:14, fill:'origin',
          backgroundColor:function(c){return gradientFill(c.chart.ctx,c.chart.chartArea,NEON.green,0.4);} } ] },
      options:{ responsive:true, interaction:{mode:'index',intersect:false},
        plugins:{legend:{position:'top',align:'end'}},
        scales:{ x:{grid:{color:hexA(NEON.cyan,0.05)},ticks:{maxRotation:0,autoSkipPadding:16}},
                 y:{beginAtZero:true,grid:{color:hexA(NEON.cyan,0.06)},ticks:{precision:0}} } } }); }

  function buildSeverity(){ var arr=global.NG_DATA.charts.severity; // [{label,value,color}]
    return mk('chart-severity',{ type:'doughnut',
      data:{ labels:arr.map(function(d){return d.label;}),
        datasets:[{ data:arr.map(function(d){return d.value;}),
          backgroundColor:arr.map(function(d){return hexA(d.color,0.85);}),
          borderColor:NEON.void, borderWidth:3, hoverBorderColor:NEON.void, hoverOffset:8,
          neonGlow:16, neonGlowColor:NEON.cyan }] },  // explicit cyan bloom halo, arcs keep own fills
      options:{ responsive:true, cutout:'62%',
        plugins:{ legend:{ position:'right', labels:{ generateLabels:function(chart){ var d=chart.data;
          return d.labels.map(function(lab,i){ return { text:lab+'  '+d.datasets[0].data[i],
            fillStyle:arr[i].color, strokeStyle:arr[i].color, pointStyle:'rectRounded', index:i }; }); } } },
          tooltip:{ callbacks:{ label:function(c){ var tot=c.dataset.data.reduce(function(a,b){return a+b;},0)||1;
            return ' '+c.label+': '+c.parsed+' ('+Math.round(c.parsed/tot*100)+'%)'; } } } } } }); }

  function buildAge(){ var arr=global.NG_DATA.charts.age; var hex=NEON.cyan; // [{label,value,color}]
    return mk('chart-age',{ type:'bar',
      data:{ labels:arr.map(function(d){return d.label;}),
        datasets:[{ label:'Findings', data:arr.map(function(d){return d.value;}),
          backgroundColor:function(c){return gradientFill(c.chart.ctx,c.chart.chartArea,hex,0.75);},
          borderColor:hex, borderWidth:1.5, borderRadius:3, neonGlow:12,
          barPercentage:1.0, categoryPercentage:1.0 }] },     // zero-gap = histogram
      options:{ responsive:true, plugins:{legend:{display:false}},
        scales:{ x:{grid:{display:false},ticks:{autoSkip:false}},
                 y:{beginAtZero:true,grid:{color:hexA(NEON.cyan,0.06)},ticks:{precision:0}} } } }); }

  function buildSubsystem(){ var rows=global.NG_DATA.charts.subsystem.slice() // [{label,value,color}]
      .sort(function(a,b){return b.value-a.value;}).slice(0,8);
    return mk('chart-subsystem',{ type:'bar',
      data:{ labels:rows.map(function(r){return r.label;}),
        datasets:[{ label:'Findings', data:rows.map(function(r){return r.value;}),
          backgroundColor:function(c){ var hex=rows[c.dataIndex]?rows[c.dataIndex].color:NEON.cyan;
            if(!c.chart.chartArea) return hexA(hex,0.4);
            var a=c.chart.chartArea, g=c.chart.ctx.createLinearGradient(a.left,0,a.right,0);
            g.addColorStop(0,hexA(hex,0.15)); g.addColorStop(1,hexA(hex,0.85)); return g; },
          borderColor:function(c){ return rows[c.dataIndex]?rows[c.dataIndex].color:NEON.cyan; },
          borderWidth:1.5, borderRadius:4, neonGlow:12, barPercentage:0.7, categoryPercentage:0.8 }] },
      options:{ indexAxis:'y', responsive:true, plugins:{legend:{display:false}},
        scales:{ x:{beginAtZero:true,grid:{color:hexA(NEON.cyan,0.06)},ticks:{precision:0}},
                 y:{grid:{display:false},ticks:{font:{family:"'Share Tech Mono', monospace",size:11}}} } } }); }

  function buildKpiSparks(){ (global.NG_DATA.charts.kpis||[]).forEach(function(k){
    if(k.spark) instances['spark-'+k.key]=sparkline('kpi-'+k.key+'-spark', k.spark, k.color); }); }

  var NGCharts = {
    theme:'neongrid-chartjs', NEON:NEON,
    rebuild:function(){ this.dispose();
      instances.trend=buildTrend(); instances.severity=buildSeverity();
      instances.age=buildAge(); instances.subsystem=buildSubsystem(); buildKpiSparks(); },
    buildAll:function(){ this.rebuild(); },
    dispose:function(){ Object.keys(instances).forEach(function(k){ try{ instances[k]&&instances[k].destroy(); }catch(e){} });
      instances={}; }
  };
  global.NGCharts = NGCharts;
})(window);
