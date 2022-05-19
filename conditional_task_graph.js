'use strict';

function conditionalTaskGraphToString(task_graph)
{
    let result = `@tasks ${task_graph.tasks.length}\n`;
    for(let task of task_graph.tasks)
    {
        result+=task.name+" "+task.successors.length;
        for(let successor of task.successors)
        {
            if(successor.hasOwnProperty("condition") && successor.condition!=null){
                result+=` C${successor.id}(${successor.data})[${successor.condition}]`;
            }
            else{
                result+=` ${successor.id}(${successor.data})`;
            }
        }
        result+="\n";
    }
    result+= `@proc ${task_graph.processors.length}\n`;
    for(let proc of task_graph.processors)
    {
        result+= `${proc.cost} ${proc.data} ${proc.hardware_core ? 0 : 1}\n`;
    }
    result+= "@times\n";
    for(let task of task_graph.tasks)
    {
        for(let t of task.times_per_processor)
        {
            result += `${t} `;
        }
        result += "\n";
    }

    result+= "@cost\n";
    for(let task of task_graph.tasks)
    {
        for(let cost of task.costs_per_processor)
        {
            result += `${cost} `;
        }
        result+="\n";
    }

    result+=`@comm ${task_graph.channels.length}\n`;
    for(let channel of task_graph.channels)
    {
        result+=`${channel.name} ${channel.cost} ${channel.data}`;
        for(let b of channel.suitable_for_processors)
        {
            result+=` ${b?1:0}`;
        }
        result+="\n";
    }
    return result;
}


function readConditionalTaskGraph(source)
{
    let task_number=0;
    let successors_number=0;

    let counter1 = 0;
    let counter2 = 0;

    let lines = source.split("\n");

    let tasks = [];
    let processors = [];
    let channels = [];

    let task = null;
    let proc = null;
    let channel = null;

    let state = 0;
    //let flag1 = true;

    let pp_counter=1;
    let hc_counter=1;

    function mParseNonNegativeInteger(source, name)
    {
        let result = parseInt(source);
        if(isNaN(result) || result < 0)
        throw `Parsing error: ${name} must be a non-negative integer`;

        return result;
    }

    function mParseBoolean(source, name)
    {
        if(source == "0" || source == "false")return false;
        else if(source == "1" || source == "true")return true;
        else throw `Parsing error: ${name} must be a boolean`;
    }


    for(let line of lines)
    {
        let words = line.split(" ");
        let i = 0;
        let s1 = null;

        while(i<words.length)
        {
            s1 = words[i];
            i+=1;
            

            //flag1 = true;

            if(s1.length==0)continue;
            if(s1[0]=="#")break;

            switch(state)
            {
            case 0:
            {
                //console.log(s1);

                if(s1=="@tasks")
                {
                    //console.log("TASKS");
                    state = 1;
                }
                else if(s1=="@proc")
                {
                    //console.log("PROC");
                    state = 5;
                }
                else if(s1=="@times")
                {
                    //console.log("TIMES");
                    state = 9;
    
                    counter1=0;
                    counter2=0;
                }
                else if(s1=="@cost")
                {
                    //console.log("COST");

                    state = 10;
    
                    counter1=0;
                    counter2=0;
                }
                else if(s1=="@comm")
                {
                    //console.log("CHANNELS");
                    state = 11;
                }   
            }
            break;
            case 1:
            {
                task_number = mParseNonNegativeInteger(s1, "Task number");
                state = 2;
                counter1 = task_number;
            }
            break;
            case 2:
            {
                if(counter1-- <= 0)
                {
                    state = 0;
                    i-=1;
                    continue;
                }

                task = {
                    "name":s1,
                    "successors":[],
                    "costs_per_processor":[],
                    "times_per_processor":[]
                }

                tasks.push(task);

                state = 3;
            }
            break;
            case 3:
            {
                successors_number = mParseNonNegativeInteger(s1, "Successors number");                
                counter2 = successors_number;
                state = 4;
            }
            break;
            case 4:
            {
                if(counter2 -- <=0 )
                {
                    state=2;
                    i-=1;
                    continue;
                }

                let condition = null;
                let data = 0;
                let id = null;

                let s2 = null;
                let C_index = s1.indexOf("C");

                if(C_index!=-1){
                    let a = s1.indexOf("[");
                    let b = s1.indexOf("]");
                    if(a==-1||b==-1 || b<a || a<C_index){
                        throw "Parsing error: "+s1;
                    }

                    condition = s1.substr(a+1, b-a-1);
                    s2 = s1.substr(0, a) + s1.substr(b+1);
                    s2 = s2.substr(0, C_index)+s2.substr(C_index+1);
                    //console.log(`s1 = ${s1}; s2 = ${s2}`)
                }
                else{
                    s2=s1;
                }
                
                let t1 = s2.indexOf("(");
                if(t1!=-1){
                    let tmp = s2.replace(")", " ").replace("(", " ").split(" ");
                    if(tmp.length<2)
                    {
                        throw "Parsing error: "+s1;
                    }
                    id = mParseNonNegativeInteger(tmp[0], "successor id");
                    data = mParseNonNegativeInteger(tmp[1], "successor data");
                }
                else{
                    id = mParseNonNegativeInteger(s2);
                }

                let successor = {id, data, condition};

                task.successors.push(successor);
            }
            break;
            case 5:
            {
                let processors_number = mParseNonNegativeInteger(s1, "Processors number");
                counter1 = processors_number;
                state = 6;
            }
            break;
            //proc

            case 6:
            {
                if(counter1-- <= 0)
                {
                    state = 0;
                    i-=1;
                    //console.log("YYYYYY" + s1);
                    continue;
                }
                let p_cost = mParseNonNegativeInteger(s1, "Processor cost");
                proc = {
                    "cost":p_cost,
                    "data":null,
                    "hardware_core":null,
                    "name":null
                };
                processors.push(proc);
                state = 7;
            }
            break;
            case 7:
            {
                proc.data = mParseNonNegativeInteger(s1, "Proc data");
                state = 8;
            }
            break;
            case 8:
            {
                let programmable_processor = mParseBoolean(s1, "PP");
                proc.hardware_core = !programmable_processor;

                if(programmable_processor){
                    proc.name = "PP"+pp_counter.toString();
                    ++pp_counter;
                }
                else{
                    proc.name = "HC"+hc_counter.toString();
                    ++hc_counter;
                }
                state = 6;
            }
            break;

            //TIMES
            case 9:
            {
                let execution_time = mParseNonNegativeInteger(s1, "Execution time");
                tasks[counter1].times_per_processor.push(execution_time);
                if(++counter2 >= processors.length)
                {
                    counter2=0;
                    if(++counter1 >= tasks.length)
                    {
                        state=0;
                        i-=1;
                        continue;
                    }
                }

            }
            break;
            //COSTS
            case 10:
            {
                let execution_cost = mParseNonNegativeInteger(s1, "Execution cost");
                tasks[counter1].costs_per_processor.push(execution_cost);
                if(++counter2 >= processors.length)
                {
                    counter2=0;
                    if(++counter1 >= tasks.length)
                    {
                        state=0;
                        i-=1;
                        continue;
                    }
                }
            }
            break;
            //CHANNELS
            case 11:
            {
                let channels_number = mParseNonNegativeInteger(s1, "Channels number");
                counter1 = channels_number;
                state = 12;
            }
            break;

            case 12:
            {
                if(counter1-- <= 0)
                {
                    state = 0;
                    i-=1;
                    continue;
                }

                channel = {
                    "name": s1,
                    "cost": null,
                    "suitable_for_processors":[]
                }
                channels.push(channel);

                state = 13;
            }
            break;
            case 13:
            {
                channel.cost = mParseNonNegativeInteger(s1, "Channel cost");
                state = 14;
            }
            break;
            case 14:
            {
                channel.data = mParseNonNegativeInteger(s1, "Channel data transfer");
                state = 15;
                counter2 = 0;
            }
            break;
            case 15:
            {
                if(counter2++>=processors.length)
                {
                    state=12;
                    continue;
                }

                let suitable_for_processor = mParseBoolean(s1, "suitable_for_processor");
                channel.suitable_for_processors.push(suitable_for_processor);
            }
            break;
            default:
                break;
            }
        }
    }

    let result = {
        "tasks": tasks,
        "processors": processors,
        "channels": channels
    }

    result.toString = function()
    {
        return conditionalTaskGraphToString(this);
    }

    return result;
}

function getConditions(task_graph){
    let tmp = [];
    for(let t of task_graph.tasks){
        for(let s of t.successors){
            if(s.hasOwnProperty("condition")&&s.condition!=null){
                tmp.push(`${t.name} -> ${task_graph.tasks[s.id].name} cond:"${s.condition}"`);
            }
        }
    }

    return tmp;
}

function executeCondition(condition){
    if(condition=="true" || condition=="True")return true;
    return false;
}

function convertConditionalToNormalTaskGraph(task_graph_conditional, executeConditionFunc = executeCondition){
    function convertTask(task){
        let costs_per_processor = task.costs_per_processor;
        let times_per_processor = task.times_per_processor;
        let name = task.name;
        let successors = task.successors.filter(s => {
            if(s.hasOwnProperty("condition") && s.condition!=null ){
                return executeConditionFunc(s.condition);
            }
            return true;
        }).map(s => {
            return {
                "id": s.id,
                "data": s.data
            }});

        return {name, successors, times_per_processor, costs_per_processor};
    }

    return {
        "tasks": task_graph_conditional.tasks.map(convertTask),
        "processors": task_graph_conditional.processors,
        "channels": task_graph_conditional.channels,
        toString(){
            return conditionalTaskGraphToString(this);
        }
    };
}


if(typeof window === 'undefined'){
    module.exports = {
        readConditionalTaskGraph,
        getConditions,
        executeCondition,
        convertConditionalToNormalTaskGraph
    }   
}
