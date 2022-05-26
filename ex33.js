'use strict';

const graph_20_src = `
@tasks 20
T0 5 1(0) 2(0) 3(0) 4(0) 5(0) 
T1 0 
T2 5 6(0) 7(0) 8(0) 9(0) 12(0) 
T3 1 9(0) 
T4 0 
T5 2 18(0) 19(0) 
T6 1 9(0) 
T7 0 
T8 2 10(0) 11(0) 
T9 0 
T10 0 
T11 0 
T12 5 13(0) 14(0) 15(0) 16(0) 17(0) 
T13 0 
T14 0 
T15 0 
T16 0 
T17 0 
T18 0 
T19 0 
@proc 4
285 0 1 
118 0 1 
0 0 0 
0 0 0 
@times 
841 693 65 58 
646 595 70 42 
776 637 6 22 
663 335 57 54 
714 785 76 70 
729 684 69 15 
662 55 27 66 
71 897 64 51 
697 868 46 36 
350 923 3 26 
60 679 30 27 
536 337 50 69 
636 587 43 51 
388 519 27 16 
270 852 81 17 
432 752 9 55 
693 76 70 6 
412 805 32 53 
692 636 34 15 
824 511 69 11 
@cost 
5 40 328 293 
48 54 104 46 
10 11 142 405 
7 69 255 183 
61 24 265 319 
31 5 47 392 
12 97 260 330 
71 36 76 111 
54 53 225 370 
55 48 75 385 
56 17 350 145 
42 67 364 99 
17 22 273 175 
8 23 157 213 
66 56 209 253 
14 47 459 159 
38 65 280 153 
19 32 73 367 
12 60 219 345 
25 2 257 178 
@comm 1
CHAN0 59 10 1 1 1 1
`;

let graph_20 = readTaskGraph(graph_20_src);

graph_20.getRandomTask = function(){
    let n = this.tasks.length;
    return this.tasks[Math.floor(Math.random()*n)];

}

let unexpected_tasks_counter = 0;
function randomUnexceptedTaskFromGraph20(){
    let t1 = graph_20.getRandomTask();
    let t2 = graph_20.getRandomTask();
    let t3 = graph_20.getRandomTask();

    let new_costs = [];
    let new_times = [];

    for(let i=0;i<t1.costs_per_processor.length;++i){
        new_costs.push(t1.costs_per_processor[i]+t2.costs_per_processor[i]+t3.costs_per_processor[i]);
        new_times.push(t1.times_per_processor[i]+t2.times_per_processor[i]+t3.times_per_processor[i]);
    }

    let new_task = {
        "name": `U${unexpected_tasks_counter}`,
        "successors":[],
        "costs_per_processor":new_costs,
        "times_per_processor":new_times
    }
    ++unexpected_tasks_counter;
    return new_task;
}


function readTasksGraphWithUnexpectedTasks(source)
{
    let task_number=0;
    let successors_number=0;

    let counter1 = 0;
    let counter2 = 0;

    let lines = source.split("\n");

    let tasks = [];
    let unexpected_tasks = [];
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
                    "unexpected_successors":[],
                    "costs_per_processor":[],
                    "times_per_processor":[]
                }

                if(s1.substr(0,2)=="UT"){
                    unexpected_tasks.push(task);
                }
                else{
                    tasks.push(task);   
                }
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

                let is_unexpected_task = false;
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
                else if(s1.substr(0,2)=="UT"){
                    s2 = s1.substr(2);
                    is_unexpected_task = true;
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

                if(is_unexpected_task){
                    task.unexpected_successors.push(successor);
                }
                else{
                    
                    task.successors.push(successor);
                }
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

    counter1 = tasks.length;

    for(let t of tasks){
        for(let us of t.unexpected_successors){
            us.id += counter1 - 1;
            t.successors.push(us);
        }
    }

    for(let t of unexpected_tasks){
        let new_task = randomUnexceptedTaskFromGraph20();
        tasks.push(new_task);
    }

    let result = {
        "tasks": tasks,
        "processors": processors,
        "channels": channels
    }

    result.toString = function(){
        return taskGraphToString(this);
    }

    return result;
}