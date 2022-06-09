'use strict';

const example_tg_str = `
@tasks 10
T0 2 1(0) 2(0) # This is a comment
T1 2 3(0) 5(0) 
T2 3 9(0) 4(0) 6(0) 
T3 2 7(0) 9(0) 
T4 1 8(0) 
T5 1 9(0) 
T6 0 
T7 0 
T8 0 
T9 0 
@proc 4
100 0 1 
200 0 1 
500 0 0 
300 0 0 
@times 
30 10 3 4 # T0
50 20 6 5 # T1
20 10 3 5 # T2
10 8  1 2 # T3
30 15 4 10 #T4
50 30 5 5  #T5
40 15 10 12 #T6
30 15 5 8 #T7
20 5  2 4 #T8
10 5  3 4 #T9
@cost 
3 2 50 10 # T0
5 4 80 20 # T1
3 3 60 20 # T2
3 1 20 5  # T3
3 2 70 30 # T4
5 3 80 15 # T5
3 2 70 15 # T6
3 2 50 18 # T7
3 1 30 10 # T8
3 1 40 12 # T9
@comm 1
CHAN0 15 7 1 1 1 1
`

class TaskGraphApp{
    constructor(){
        this.state = 0;
        this.selected_branch = 0;

        this.task_graph = null;
        this.embedded_system = null;
        this.avalaible_processors = null;

        let _this = this;
        
        this.s_divs = Array.from({length:6}, (x, i)=>
        document.getElementById("s"+i.toString()) );

        for(let s_div of this.s_divs){
            let go_back_button = s_div.querySelector("button[role='go_back']");
            if(go_back_button!=null){
                go_back_button.onclick = function(){
                    _this.goBack();
                };
            }
        }

        let s0_text_area = this.s_divs[0].querySelector("textarea");
        s0_text_area.value = example_tg_str;

        let s0_file_btn = this.s_divs[0].querySelector("button[role='open']");
        s0_file_btn.onclick = function(){
            readTextFile(function(text){
                s0_text_area.value = text;
            });
        }


        let s0_form = this.s_divs[0].querySelector("form");
        s0_form.onsubmit = function(event){
            event.preventDefault();
            try{
                _this.task_graph = readTaskGraph(s0_text_area.value);
                _this.goNext();
            }
            catch(e){
                alert(e);
            }
        }

        let s1_form = this.s_divs[1].querySelector("form");
        s1_form.onsubmit = function(event){
            event.preventDefault();

            let formData = new FormData(s1_form);
            _this.selected_branch = parseInt(formData.get("selected_branch"));

            if(_this.selected_branch==0){
                _this.prepareS2Dialog();
                _this.goNext();
            }
            else if(_this.selected_branch==1){
                try{
                    _this.embedded_system = findTheFastestSolution(_this.task_graph);
                    //console.log(_this.embedded_system);
                    _this.prepareS4SystemDescription(true);
                    _this.goNext();
                }
                catch(e){
                    alert(e);
                }
            }
            else if(_this.selected_branch==2){
                try{
                    _this.embedded_system = findTheCheapestSolution(_this.task_graph);
                    //console.log(_this.embedded_system);
                    _this.prepareS4SystemDescription();
                    _this.goNext();
                }
                catch(e){
                    alert(e);
                }
            }
        }

        let s2_form = this.s_divs[2].querySelector("form");
        s2_form.onsubmit = function(event){
            event.preventDefault();
            let formData = new FormData(s2_form);

            _this.avalaible_processors = [];
           

            for(let fd of formData){

                let p_name = fd[0];
                let p_index = _this.task_graph.processors.findIndex(p => p.name == p_name);

                let n = parseInt(fd[1]);
                for(let i=0;i<n;++i){

                    _this.avalaible_processors.push({
                        "name":p_name + "_"+ i.toString(),
                        "type_id":p_index,
                        "hardware_core":false,
                    })
                }
            }

            for(let i=0;i<_this.task_graph.processors.length;++i){
                let p = _this.task_graph.processors[i];
                if(p.hardware_core){
                    _this.avalaible_processors.push({
                        "name":p.name,
                        "type_id":i,
                        "hardware_core":true,
                    })
                }
            }

            _this.prepareS3Dialog();
            _this.goNext();
        }

        let s3_form = this.s_divs[3].querySelector("form");

        s3_form.onsubmit = function(event){
            event.preventDefault();
            let formData = new FormData(s3_form);

            _this.embedded_system = [];
            for(let i=0;i<_this.avalaible_processors.length;++i){
                let tasks = [];
                for(let fd of formData){
                    if(fd[1]==i){
                        tasks.push(fd[0]);
                    }
                }

                _this.embedded_system.push({
                    "processor": _this.avalaible_processors[i],
                    "tasks": tasks,
                })
            }

            _this.prepareS4SystemDescription();
            _this.goNext();
        }

        this.cost_gains_div = this.s_divs[4].querySelector("div[role='modify_system_with_cost_gains']");

        let cost_gains_form = this.cost_gains_div.querySelector("form");

        this.embedded_system2 = null;
        
        cost_gains_form.onsubmit = function(event){
            event.preventDefault();
            let fd = new FormData(cost_gains_form);
            let min_cost_gain = fd.get("min_cost_gain");

            _this.embedded_system2 = modifySystemByCostGains(_this.task_graph, _this.embedded_system, min_cost_gain);
            //console.log(_this.embedded_system2);
            _this.prepareS5SystemDescription();
            _this.goNext();
        }
    }
    prepareS2Dialog(){
        let s2_form_table = this.s_divs[2].querySelector("table");
        let inner_html = "";
        for(let processor of this.task_graph.processors){
            if(!processor.hardware_core){
                inner_html+=`<tr>
                <td> <label> ${processor.name} </label> </td>
                <td> <input name="${processor.name}" type="number" min=0 required value="0" /> </td>
                </tr>`;
            }
        }
        s2_form_table.innerHTML = inner_html;
    }

    prepareS3Dialog(){
        let s3_avalaible_processors = this.s_divs[3].querySelector("span");
        s3_avalaible_processors.innerText = this.avalaible_processors.map(p => p.name).join(",");

        let select_options_html = "";

        for(let i=0;i<this.avalaible_processors.length;++i){
            select_options_html += `
            <option value=${i}>${this.avalaible_processors[i].name}</option>
            `;
        }
        let inner_html2 = "";

        let form_table = this.s_divs[3].querySelector("table");
        for(let task of this.task_graph.tasks){
            inner_html2 += `
            <tr>
            <td>${task.name}</td>
            <td> <select name="${task.name}"> ${select_options_html} </select> </td>
            </tr>
            `;
        }

        form_table.innerHTML = inner_html2;
    }

    mRenderSystem(container){

        let cost_results = calculateCost(this.embedded_system, this.task_graph);
        let time_results = calculateTime(this.embedded_system, this.task_graph);

        let inner_html =  `
        <h3>System:</h3>
        <p>${renderSystemDescription(this.embedded_system)}</p>

        <br/>
        <p>Cost of programmable processors: ${cost_results.cost_of_processors}</br>
        Cost of execution: ${cost_results.cost_of_execution}</br>
        Cost of channels: ${cost_results.cost_of_channels}</br>
        Total cost: ${cost_results.total_cost} </br>
        Total time: ${time_results.total_time} </p>
        `;
        let system_description_div = container.querySelector("div[role='system_description']");
        system_description_div.innerHTML = inner_html;

        let gantt_div = container.querySelector("div[role='gantt_chart']");
        drawGanttChart(gantt_div, time_results);
    }

    prepareS4SystemDescription(show_cost_gains_form=false){
        this.mRenderSystem(this.s_divs[4]);
        /*let system_description = this.s_divs[4].querySelector("div[role='system_description']");
        system_description.innerHTML = renderSystemDescriptionWithStatistics(this.task_graph, this.embedded_system);*/

        if(show_cost_gains_form){
            this.cost_gains_div.style.display=null;
        }
        else{
            this.cost_gains_div.style.display="none";
        }
    }

    prepareS5SystemDescription(){
        this.mRenderSystem(this.s_divs[5]);
        /*let system_description = this.s_divs[5].querySelector("div[role='system_description']");
        system_description.innerHTML = renderSystemDescriptionWithStatistics(this.task_graph, this.embedded_system2);*/
    }

    goNext(){
        this.s_divs[this.state].style.display="none";
        if(this.selected_branch==0){
            ++this.state;
        }
        else if(this.state==1 && this.selected_branch<=2){
            this.state=4;
        }
        else if(this.state==4){
            this.state=5;
        }
      
        this.s_divs[this.state].style.display=null;
    }

    goBack(){
        this.s_divs[this.state].style.display="none";

        if(this.selected_branch==0){
            --this.state;
        }
        else if(this.state==1){
            this.state=0;
        }
        else if(this.state==4){
            this.state=1;
        }
        else if(this.state==5){
            this.state=4;
        }

        this.s_divs[this.state].style.display=null;
    }
}