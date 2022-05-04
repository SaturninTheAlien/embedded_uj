'use strict';


class BracketTreeApp{
    constructor(){
        let _this = this;
        this.solution_div = document.getElementById("solution_div");
        this.task_graph = null;
        
        let task_graph_form = document.getElementById("task_graph_form");
        task_graph_form.onsubmit = function(event){
            event.preventDefault();
            let fd = new FormData(task_graph_form);
            let tg_source = fd.get("tg_source");

            try{
                _this.task_graph = readTaskGraph(tg_source);
            }
            catch(e){
                alert(e);
            }

            if(_this.task_graph!=null){
                _this.main();
            }
        }
    }


    main(){

        let _this = this;


        let tree1 = createRandomSpanningTree(this.task_graph);
        let tree2 = createRandomSpanningTree(this.task_graph);


        let system1 = createEmbeddedSystemFromSpanningTree(this.task_graph, tree1);
        let system2 = createEmbeddedSystemFromSpanningTree(this.task_graph, tree2);

        let inner_html = `
        <p> Tree1: ${tree1.constructionOptionsBracketNotation()} </p>
        <div>System1:
        ${renderSystemDescriptionFlex(this.task_graph, system1, false)}
        </div>

        <p> Tree2: ${tree2.constructionOptionsBracketNotation()} </p>
        <div>System2:
        ${renderSystemDescriptionFlex(this.task_graph, system2, false)}
        </div>
        `

        this.solution_div.innerHTML = inner_html;
        this.solution_div.style.display = null;

    }
}