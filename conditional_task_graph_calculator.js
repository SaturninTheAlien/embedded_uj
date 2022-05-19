'use strict';

const example_tg_str = `
@tasks 10
T0 3 1(9) 3(74) 9(173) 
T1 3 5(104) 7(115) C8(129)[true] 
T2 0 
T3 1 5(70) 
T4 1 C8(117)[false] 
T5 1 C8(155)[false] 
T6 1 C8(189)[false]
T7 2 C8(143)[false] 9(70) 
T8 1 9(12) 
T9 0 
@proc 5
0 0 0
0 0 0
62 0 1
145 0 1
63 0 1
@times
30 3 263 990 899 
37 36 560 864 935 
42 44 171 256 347 
6 46 246 593 998 
34 31 477 245 419 
36 34 699 240 478 
17 17 134 346 939 
1 36 115 502 490 
29 14 836 628 111 
27 36 974 694 498 
@cost
586 691 67 45 99 
676 599 45 29 37 
710 657 51 26 30 
731 796 38 86 53 
635 639 57 19 25 
760 820 99 77 28 
944 641 13 83 95 
669 838 70 98 50 
958 616 13 88 40 
865 861 93 18 91 
@comm 2
CHAN0 72 1 1 1 1 1 1 
CHAN1 77 2 0 0 1 0 0 
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
                let conditional_tg = readConditionalTaskGraph(s0_text_area.value);
                _this.task_graph = convertToNormalTaskGraph(conditional_tg);

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

    prepareS4SystemDescription(show_cost_gains_form=false){


        let system_description = this.s_divs[4].querySelector("div[role='system_description']");
        system_description.innerHTML = renderSystemDescriptionWithStatistics(this.task_graph, this.embedded_system);

        if(show_cost_gains_form){
            this.cost_gains_div.style.display=null;
        }
        else{
            this.cost_gains_div.style.display="none";
        }
    }

    prepareS5SystemDescription(){
        let system_description = this.s_divs[5].querySelector("div[role='system_description']");
        system_description.innerHTML = renderSystemDescriptionWithStatistics(this.task_graph, this.embedded_system2);
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