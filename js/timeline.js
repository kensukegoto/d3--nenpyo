// 変数名は キャメル
// 関数名は _で始まるキャメル
// 関数に渡す o はdefferedオブジェクト


function make_timeline(){
    
    var pathTlData = "data/timeline.csv";
    
    var timeLine = function(){
        
        // プロパティ定義
        this.dataFrCsv = null;
        this.main = [];
        this.relate = [];
        this.other = [];
        this.days = [];
        this.date = new Date();
        this.eventName = {};
        // ｘスケールの基準
        this.idxMon = null;
        // 選択地点
        this.idxPt = null;
        // zoomレベル
        this.zoomLev = 0;
        // xスケールの起点
        this.start = 0;
        // xスケールの終点
        this.end = 0;

       
    };
    
    // csvの取得
    timeLine.prototype._getData = function(csv,o){
        
       
        var ctx = this;
        
        // 今月を判断
        var toMonth = d3.timeFormat("%Y/%m/1");
       
        ctx.date = new Date(toMonth(this.date));

        
        
        d3.csv(csv,function(d,i,col){
        
            d.date = new Date(d.date);

            return d;
            
        },function(err,data){
            // csvをそのまま保存
            ctx.dataFrCsv = data;
            
            ctx.end = data.length;
            
            ctx._saveData();
                        
            o.resolve();
        });
    };
    
    
    timeLine.prototype._saveData = function(){
        
            var ctx = this;
            var data = ctx.dataFrCsv;
        
            ctx.main = [];
            ctx.relate = [];
            ctx.other = [];
        
            var month = d3.timeFormat("%Y年%m月");
            // csvを加工して保存
            for(var i = ctx.start; i < ctx.end; i++){
     
                if(isNaN(i)) continue;
                
                
                (ctx.idxMon===null) && (String(data[i].date)==String(ctx.date)) && (ctx.idxPt = ctx.idxMon = +i)
                
                
            
                if(data[i].main){
                    ctx.main.push({
                        "date":data[i].date,
                        "name-eve": data[i].main,
                        "posY":2,
                        "idx":i,
                        "name": "main"
                    });
                }
                
                if(data[i].relate){
                    ctx.relate.push({
                        "date":data[i].date,
                        "name-eve": data[i].relate,
                        "posY":1,
                        "idx":i,
                        "name": "relate"
                    });
                }
                
                if(data[i].other){
                    ctx.other.push({
                        "date":data[i].date,
                        "name-eve": data[i].other,
                        "posY":0,
                        "idx":i,
                        "name": "other"
                    });
                }
                

                
                ctx.eventName[String(data[i].date)] = {
                    "year": month(data[i].date),
                    "main":data[i].main,
                    "relate":data[i].relate,
                    "other":data[i].other
                };
                
                
                
                
            
            }
      
        
    }
    
    // 年表の描画
    timeLine.prototype._makeTimeline = function(){
        
        var ctx = this;
        var width = $("#tl-in").width(),
            height = $("#tl-in").height();
        
        var margin = {top: 20, right: 50, bottom: 50, left: 50};
        width = parseInt(width) - margin.left - margin.right;
        height = parseInt(height) - margin.top - margin.bottom;
        

        // 日付データに変更
        var parseTime = d3.timeParse("%d-%b-%y");
        var formatMonth = d3.timeFormat("%m月");
        
        // スケール
        var x = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);
                
        var xBgLine = d3.scaleLinear().range([0, width]).domain([0,1]);
        
        
        x.domain(d3.extent(ctx.dataFrCsv, function(d) { return d.date; }));
        // ドメインに設定した全てのデータを days配列に入れる
        var sDay = new Date(x.domain()[0]);
        var eDay = new Date(x.domain()[1]);
        // 期間中の日数
        var allDay = (eDay-sDay)/(24*60*60*1000);
        
        y.domain([0,3]);
        
        var now = ctx.dataFrCsv[ctx.idxPt].date;
        var baseX = width*(1/2);
        var difX = baseX - x(now);
        
        var zoomLev = 0;
        
        // データにキーをつける
        function key(d,i){

            return d.idx;

        }
         
        var svg = d3.select("#tl-in")
            .append("svg")
            .attr("id","tl-svg")
            .attr("width",width+margin.left+margin.right)
            .attr("height",height+margin.top+margin.bottom)
            .call(
                d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end",dragend)
            )
        
        
        var svgArea = svg.append("g")
            .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");
        
        var linePt = svgArea.append("rect")
            .attr("id","line-pt")
            .attr("width",7)
            .attr("height",height)
            .attr("x",baseX-3)
            .attr("opacity",0.7);
        
        var gArea = svgArea.append("g")
            .attr("id","gArea")
        
        gArea.attr("transform","translate("+difX+",0)")
            
        
        var valueline = d3.line()
            .x(function(d) { return xBgLine(d.x); })
            .y(function(d) { return y(d.y)-(height/3)/2; })

        var pathInfo = [
            [{x:-2,y:0,name:"bg-other"},{x:2,y:0,name:"bg-other"}],
            [{x:-2,y:1,name:"bg-relate"},{x:2,y:1,name:"bg-relate"}],
            [{x:-2,y:2,name:"bg-main"},{x:2,y:2,name:"bg-main"}]
        ];
        

        var centlines = gArea.append("g")
            .attr("id","centLines")
            .selectAll(".centLine")
            .data(pathInfo)
            .enter()
            .append("path")
            .attr("class","centLine")
            .attr("d",function(d,i){
                return valueline(d)
            })
            .attr("stroke","#aaaaaa")
            .style("stroke-width", 2);
  
        
        

        var dotsArea = gArea.append("g").attr("id","dots-area");
        
        
        
        dotsArea.selectAll(".dots")
            .data([ctx.main,ctx.relate,ctx.other])
            .enter()
            .append("g")
            .attr("class","dots")
            .selectAll(".dot")
            .data(function(d){
                return d;
            },key)
            .enter()
            .append("circle")
            .attr("class",function(d,i){
            
                var day = d.date;
                day = (new Date(day)-sDay)/(24*60*60*1000);
                
                return "dot-"+d.name+" "+"d"+day;
            })
            .attr("r",6)
            .attr("cx", function(d){ 
           
                return x(d.date);})
            .attr("cy", function(d,i){
            
                var posY = d.posY;
                
                return y(posY)-(height/3)/2;
            })
        
        

            
        
        // X軸を追加
        var xAxis = gArea.append("g")
            .attr("id","xAxis")
            .style("text-anchor","start")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));


        d3.select("#xAxis").selectAll("text").attr("transform",function(){
           return "rotate(45)";
        });
        
        
        searchEv();
        
        // drag
        var dr = 0;
        var dist = difX;

        function dragstarted(){

            dr = d3.event.x;

        }
        
        function dragged(){

            // 元の位置から動かすべきｘの値
            dist = -(dr - d3.event.x);

            dist = dist+difX;

            gArea.attr("transform","translate("+dist+",0)")

        }

        function dragend(){

            // 一番近いところに寄せる
            difX = dist;

            var xPos = x.invert(baseX-difX);
            
            
            var x0 = (x(xPos));
            var x1 = x(_toSelectMon(xPos));
            
            
            // xPosがスタートより小さいなら
            if(!(sDay<=xPos)){
                
                xPos = sDay;
                x1 = x(_toSelectMon(xPos));
                
            }else if(eDay<=xPos){
                
                xPos = eDay;
                x1 = x(_toSelectMon(xPos));
                
            }
            
            
            difX = dist = dist - (x1-x0)
  
            now = _toSelectMon(xPos);
            
            gArea.attr("transform","translate("+dist+",0)")
            
            // イベントを探す
            searchEv();

        }
        
        
        // 左の移動量
        var lDist = 0;
        // 右の移動量
        var rDist = 0;

        var zoomin = 1;
        
        // zoom
        d3.selectAll(".zoomer").on("click",function(){
            
           
            
            var motion = $(this).data("motion");
            
            var lnum = (new Date(now) - sDay)/(24*60*60*1000);
            var rnum = allDay - lnum;
          
            //  今回
            var l = lnum*zoomin;
            var r = rnum*zoomin;
            
            if(motion==="zoomin"){
                
                ++zoomLev;
                
                lDist -= l;
                rDist += r;
            }else{
                
                if(--zoomLev<0){
                    ++zoomLev;
                    return;
                }
                
                lDist += l;
                rDist -= r;
            }
            
            
            
            x.range([
                lDist,
                width + rDist
            ]);
            
            xBgLine.range([
                lDist,
                width + rDist
            ]);
            
            difX = baseX -x(now);
          
            gArea.attr("transform","translate("+difX+",0)")

            xAxis.transition().call(d3.axisBottom(x).ticks(
                
                    d3.timeMonth.filter(function(d){
                        
                        if(zoomLev===0){
                            return d.getMonth()%3===0;
                        }
                        return true;
                    })
                
            ))
            
            d3.select("#xAxis").selectAll("text").attr("transform",function(){
               return "rotate(45)";
            });
            
            updateGraph()
            
            
            
        }); // zoom
        
        
        function updateGraph(){
            
            var dataSet = [ctx.main,ctx.relate,ctx.other];
            
            for(var i in dataSet){
                
                var data = dataSet[i];
                var dataName = dataSet[i][0].name;
                
                d3.selectAll('.dot-'+dataName)
                    .transition()
                    .attr("cx", function(d){ return x(d.date);})
                    .attr("cy", function(d){ 

                        var posY = d.posY;

                        return y(posY)-(height/3)/2;
                    })
                
            }
            
            
            d3.selectAll(".centLine")
                .transition()
                .attr("d",function(d,i){
           
                    return valueline(d)
            })


                     
        } // updateGraph
        
        
        // 15日前後で判断
        function _toSelectMon(date){
            
            date = new Date(date)
            
            var fix = 20*24*60*60*1000;
            
            var toDay = d3.timeFormat("%d");
            var format = d3.timeFormat("%Y/%m/1");
            
            var day = +toDay(date);
            
            if(day>15){
                var longTime = Date.parse(date) + fix;
                date = new Date(longTime);
            }
            
            return new Date(format(date));
            

        }
        
        function searchEv(){
            
            var events = ctx.eventName[String(now)];
            
            var day = (now - sDay)/(24*60*60*1000)
            
            $("#tl-lab caption").text(events.year);
            $(".lab-main .lab-txt").text(events.main);
            $(".lab-relate .lab-txt").text(events.relate);
            $(".lab-other .lab-txt").text(events.other);
            
            dotsArea.selectAll(".dots")
                .selectAll("circle")
                .transition()
                .duration(100)
                .attr("r",4);
            
            dotsArea.selectAll(".dots")
                .selectAll(".d"+day)
                .transition()
                .duration(100)
                .attr("r",8);
            
            
            
            
        }
        
        


        
        
    };
    
    
    
    
    
    
    // 
    var tl = new timeLine();
    var cboTlData = $.Deferred();
    
    tl._getData(pathTlData,cboTlData);
    
    cboTlData.done(function(){
        //test.say_hello();
        tl._makeTimeline();
        
    });
    
    

}



window.addEventListener("load",make_timeline,false);