'use strict'


/**
 * 1. New (not allocated) the fastest
 * 2. New (not allocated) the cheapest
 * 3. Used the fastest                  -> fallback 1
 * 4. Used the cheapest                 -> fallback 2
 * 5. Used min (time*cost)              -> fallback 6
 * 6. New min (time*cost)  
 * 7. Idle for the longest time         -> fallback 6
 * 8. The rarest used                   -> fallback 6
 * 9. The same as predecessor           -> fallback 6
 */

class SpanningTreeNode{
    constructor(task_index, construction_option=0){
        this.task_index = task_index;
        this.construction_option = construction_option;
        this.children = [];
    }
    // bracket notation
    toString(){
        let result = `${this.task_index}<${this.construction_option}>`

        if(this.children.length>0){
            result+="(" + this.children.map(a=>a.toString()).join(",") + ")";
        }

        return result;
    }

    constructionOptionsBracketNotation(){
        let result = this.construction_option.toString();
        if(this.children.length>0){
            result+="(" + this.children.map(a=>a.constructionOptionsBracketNotation()).join(",") + ")"; 
        }
        return result;
    }

}


function createSpanningTree(task_graph, choose_construction_option){
    if(task_graph.tasks.length==0)return null;

    let s1 = new Set();
    
    function f1(parent_node, task){
        for(let s of task.successors){

            let s_id = s.id;
            if(!s1.has(s_id)){

                s1.add(s_id);
                let s_task = task_graph.tasks[s_id];
                let child_node = new SpanningTreeNode(s_id, choose_construction_option(s_task));

                f1(child_node, s_task);

                parent_node.children.push(child_node);
            }
        }
    }

    let root_task = task_graph.tasks[0];
    let root = new SpanningTreeNode(0, choose_construction_option(root_task));

    s1.add(0);
    f1(root, root_task);

    return root;
}

function createRandomSpanningTree(task_graph){
    return createSpanningTree(task_graph, function(){
        return Math.floor(Math.random() * 9) + 1;
    })
}


function createEmbeddedSystemFromSpanningTree(task_graph, spanning_tree){

    let embedded_system = [];

    function addNewProcessor(chosen_index, task){
        let chosen_proc_type = task_graph.processors[chosen_index];
        if(chosen_proc_type.hardware_core){
            let e = embedded_system.find(a => a.proc_type_id == chosen_index);
            if(e==null){
                embedded_system.push({
                    "tasks": [task.name, ],
                    "processor": {
                        "hardware_core": true,
                        "type_id": chosen_index,
                        "name": chosen_proc_type.name
                    }
                });
            }
            else{
                e.tasks.push(task.name);
            }

            return null;
        }
        else{
            let proc_counter = embedded_system.filter(a => a.processor.type_id == chosen_index).length;
            embedded_system.push({
                "tasks": [task.name, ],
                "processor": {
                    "hardware_core": false,
                    "type_id": chosen_index,
                    "name": chosen_proc_type.name +"_"+proc_counter
                }
            });

            return embedded_system[embedded_system.length-1]; 
        }
    }

    function new_the_fastest(task){
        let chosen_index = 0;
        let chosen_time = task.times_per_processor[0];

        for(let i=1;i<task_graph.processors.length;++i){
            let new_time = task.times_per_processor[i];
            if(new_time < chosen_time){

                chosen_time = new_time;
                chosen_index = i;
            }    
        }
        return addNewProcessor(chosen_index, task);
    }

    function new_the_cheapest(task){
        let chosen_index = 0;
        let chosen_cost = task.costs_per_processor[0];

        for(let i=1;i<task_graph.processors.length;++i){
            let new_cost = task.costs_per_processor[i];

            if(new_cost < chosen_cost){

                chosen_cost = new_cost;
                chosen_index = i;
            }    
        }

        return addNewProcessor(chosen_index, task);
    }

    function new_best_tcm(task){
        let chosen_index = 0;
        let chosen_tcm = task.costs_per_processor[0] * task.times_per_processor[0];

        for(let i=1;i<task_graph.processors.length;++i){
            let new_tcm = task.costs_per_processor[i];

            if(new_tcm < chosen_tcm){

                chosen_tcm = new_tcm;
                chosen_index = i;
            }    
        }
        return addNewProcessor(chosen_index, task);
    }

    function used_the_fastest(task){
        
        let chosen_element = null;
        let chosen_time = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_time = task.times_per_processor[e.processor.type_id];
                if(new_time<chosen_time){

                    chosen_time = new_time;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            return new_the_fastest(task);
        }
        else{
            chosen_element.tasks.push(task.name);
            return chosen_element;
        }
    }

    function used_the_cheapest(task){
        let chosen_element = null;
        let chosen_cost = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_cost = task.costs_per_processor[e.processor.type_id];

                if(new_cost<chosen_cost){

                    chosen_cost = new_cost;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            return new_the_cheapest(task);
        }
        else{
            chosen_element.tasks.push(task.name);
            return chosen_element;
        }
    }

    function used_best_tcm(task){
        let chosen_element = null;
        let chosen_tcm = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_tcm = task.costs_per_processor[e.processor.type_id]*
                task.times_per_processor[e.processor.type_id];

                if(new_tcm<chosen_tcm){

                    chosen_tcm = new_tcm;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            return new_best_tcm(task);
        }
        else{
            chosen_element.tasks.push(task.name);
            return chosen_element;
        }
    }

    function the_rarest_used(task){
        let chosen_element = null;
        let tmp = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_tmp = e.tasks.length;
                if(new_tmp<tmp){

                    tmp = new_tmp;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            return new_best_tcm(task);
        }
        else{
            chosen_element.tasks.push(task.name);
            return chosen_element;
        }
    }

    function mCalculateTime(task_name, proc_type_id){
        let task = task_graph.tasks.find(t => t.name==task_name);
        if(task==null){
            throw `Task with the name ${task_name} not found`;
        }
        return task.times_per_processor[proc_type_id];
    }

    function idle_the_longest_time(task){
        let chosen_element = null;
        let tmp = Number.MAX_VALUE;

        for(let e of embedded_system){
            if(!e.processor.hardware_core){
                let new_tmp = e.tasks.
                map(t_name => mCalculateTime(t_name, e.processor.type_id)).
                reduce((a,b)=>a+b);

                if(new_tmp<tmp){

                    tmp = new_tmp;
                    chosen_element = e;
                }
            }
        }

        if(chosen_element==null){
            return new_best_tcm(task);
        }
        else{
            chosen_element.tasks.push(task.name);
            return chosen_element;
        }
    }

    function f1(tree_node){
        if(tree_node==null)return;

        let task = task_graph.tasks[tree_node.task_index];
        let previous_element = null;

        switch(tree_node.construction_option){
            case 1:{
                previous_element = new_the_fastest(task);
            }
            break;
            case 2:{
                previous_element = new_the_cheapest(task);
            }
            break;
            case 3:{
                previous_element = used_the_fastest(task);
            }
            break;
            case 4:{
                previous_element = used_the_cheapest(task);
            }
            break;
            case 5:{
                previous_element = used_best_tcm(task);
            }
            break;
            case 6:{
                previous_element = new_best_tcm(task);
            }
            break;
            case 7:{
                previous_element = idle_the_longest_time(task);
            }
            break;
            case 8:{
                previous_element = the_rarest_used(task);
            }
            break;
            case 9:{
                if(previous_element!=null){
                    previous_element.tasks.push(task.name);
                }
                else{
                    previous_element = new_best_tcm(task);
                }
            }
            break;
            default:
                throw `Unsupported construction option: ${tree_node.construction_option}`;
        }

        for(let child_node of tree_node.children){
            f1(child_node);
        }
    }

    f1(spanning_tree);
    
    return embedded_system;
}


if(typeof window === 'undefined'){
    
    module.exports = {
        createSpanningTree,
        createRandomSpanningTree,
        createEmbeddedSystemFromSpanningTree
    }
}