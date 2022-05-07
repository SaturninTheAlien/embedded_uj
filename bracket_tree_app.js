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

    renderSystemDescriptionFromTree(spanning_tree){

        let system = createEmbeddedSystemFromSpanningTree(this.task_graph, spanning_tree);

        let inner_html = `
        <div style="display: flex;">
            <div style="flex: 1;">
                <p> Tree: ${spanning_tree.constructionOptionsBracketNotation()} </p>
                ${renderSystemDescription(system)}
            </div>

            <div style="flex: 1;">
                ${renderSystemStatistics(this.task_graph, system, false)}
            </div>
        </div>
        `

        return inner_html;
    }


    main(){

        this.tree1 = createRandomSpanningTree(this.task_graph);
        this.tree2 = createRandomSpanningTree(this.task_graph);

        let inner_html = `
        <div>
        <p class="fd"> System1 </p>
            ${this.renderSystemDescriptionFromTree(this.tree1)}

        </div>

        <div>
        <p class="fd"> System2 </p>
            ${this.renderSystemDescriptionFromTree(this.tree2)}
            
        </div>
        `

        this.solution_div.innerHTML = inner_html;
        this.solution_div.style.display = null;

    }
}