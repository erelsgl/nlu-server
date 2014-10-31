[
    {
        "input": "no..you be <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "no..you be programmer"
    },
    {
        "input": "if you want <VALUE> <ATTRIBUTE> we have to change the agreements about <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}",
            "{\"Reject\":\"Working Hours\"}"
        ],
        "initial": "if you want 20% pension we have to change the agreements about working hours"
    },
    {
        "input": "with <ATTRIBUTE>, <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "with car, slow promotion"
    },
    {
        "input": "<VALUE> without <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Project Manager\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "project manager without car"
    },
    {
        "input": "fine, but no <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Reject\":\"Leased Car\"}"
        ],
        "initial": "fine, but no car"
    },
    {
        "input": "no, it is <VALUE> hour days",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}",
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "no, it is 9 hour days"
    },
    {
        "input": "we will not agree",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "we will not agree"
    },
    {
        "input": "how does <VALUE> nis long term sound to you?",
        "output": [
            "{\"Offer\":{\"Salary\":\"20000\"}}"
        ],
        "initial": "how does 20000 nis long term sound to you?"
    },
    {
        "input": "sign agreement",
        "output": [
            "{\"Query\":\"accept\"}"
        ],
        "initial": "sign agreement"
    },
    {
        "input": "i offer <VALUE> and a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Salary\":\"10,000 NIS\"}}"
        ],
        "initial": "i offer 10000 and a leased car"
    },
    {
        "input": "you will get <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"10,000 NIS\"}}"
        ],
        "initial": "you will get 10000"
    },
    {
        "input": "this is my final offer",
        "output": [
            "{\"Insist\":\"previous\"}"
        ],
        "initial": "this is my final offer"
    },
    {
        "input": "how are you ?",
        "output": [
            "{\"Greet\":true}"
        ],
        "initial": "how are you ?"
    },
    {
        "input": "<VALUE> . <VALUE> hour days and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}",
            "{\"Offer\":{\"Salary\":\"20000\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "20000 . 9 hour days and 10% pension fund"
    },
    {
        "input": "i am thinking <VALUE> nis as the role is for <VALUE>. however, the <ATTRIBUTE> track is <VALUE>.",
        "output": [
            "{\"Offer\":{\"Job Description\":\"QA\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i am thinking 7000 nis as the role is for qa. however, the promotion track is fast."
    },
    {
        "input": "<VALUE> , <VALUE>, without <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE> track, <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "12000 , programmer, without leased car, 0% pension, fast promotion track, 8 hours"
    },
    {
        "input": "what do you think about <VALUE> ?",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "what do you think about 9 ?"
    },
    {
        "input": "i will give you <VALUE> nis and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "i will give you 7000 nis and 10 hours"
    },
    {
        "input": "you will get <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "you will get 7000 nis"
    },
    {
        "input": "we already agreed <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "we already agreed 10 hours"
    },
    {
        "input": "you will work <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "you will work 9 hours"
    },
    {
        "input": "i can give you <VALUE> <ATTRIBUTE>, but no <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "i can give you 8 hours, but no leased car"
    },
    {
        "input": "with <ATTRIBUTE> and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "with car and 9 hours"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> a day as <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"QA\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "9 hours a day as qa"
    },
    {
        "input": "are you willing to take <VALUE> <ATTRIBUTE>?",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "are you willing to take 10% pension?"
    },
    {
        "input": "i offer <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i offer 7000 nis"
    },
    {
        "input": "we are wasting time and losing points",
        "output": [
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "we are wasting time and losing points"
    },
    {
        "input": "compromise only on <VALUE> <ATTRIBUTE>.",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}",
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "compromise only on 9 hours."
    },
    {
        "input": "i counter with <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "i counter with programmer"
    },
    {
        "input": "get a <ATTRIBUTE> and work <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "get a leased car and work 9 hours"
    },
    {
        "input": "no <ATTRIBUTE>!",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no car!"
    },
    {
        "input": "okay i accept with <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"Leased Car\"}"
        ],
        "initial": "okay i accept with leased car"
    },
    {
        "input": "if you want a <ATTRIBUTE> you need to work <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "if you want a car you need to work 10 hours"
    },
    {
        "input": "we can opt out",
        "output": [
            "{\"Insist\":\"previous\"}"
        ],
        "initial": "we can opt out"
    },
    {
        "input": "<VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "9 hours"
    },
    {
        "input": "okay then",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "okay then"
    },
    {
        "input": "what <ATTRIBUTE> you want?",
        "output": [
            "{\"Query\":\"Job Description\"}"
        ],
        "initial": "what job you want?"
    },
    {
        "input": "i will give you <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "i will give you 12000"
    },
    {
        "input": "my only offer",
        "output": [
            "{\"Insist\":\"previous\"}"
        ],
        "initial": "my only offer"
    },
    {
        "input": "<VALUE> <ATTRIBUTE>, i can not do less, please accept",
        "output": [
            "{\"Insist\":\"Working Hours\"}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}",
            "{\"Query\":\"accept\"}"
        ],
        "initial": "9 hours, i can not do less, please accept"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> and a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "10 hours and a car"
    },
    {
        "input": "<ATTRIBUTE>s can not be given",
        "output": [
            "{\"Reject\":\"Pension Fund\"}"
        ],
        "initial": "pension funds can not be given"
    },
    {
        "input": "i dont think that will work.",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "i dont think that will work."
    },
    {
        "input": "i agree to the <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"Pension Fund\"}"
        ],
        "initial": "i agree to the 10% pension fund"
    },
    {
        "input": "i would be willing to offer <VALUE> .",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "i would be willing to offer 12000 ."
    },
    {
        "input": "whithout a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "whithout a car"
    },
    {
        "input": "<VALUE> ?",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "12000 ?"
    },
    {
        "input": "okay, <VALUE> <ATTRIBUTE>, <VALUE> nis, <VALUE>.",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "okay, 9 hours, 12000 nis, programmer."
    },
    {
        "input": "no lissed <ATTRIBUTE> but you be <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no lissed car but you be team manager"
    },
    {
        "input": "<VALUE> is batter",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "slow is batter"
    },
    {
        "input": "i will give you a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "i will give you a leased car"
    },
    {
        "input": "i didnt accept the <ATTRIBUTE> will be <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i didnt accept the salary will be 7000"
    },
    {
        "input": "cant accept",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "cant accept"
    },
    {
        "input": "there is no agreement on the <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"No agreement\"}}"
        ],
        "initial": "there is no agreement on the leased car"
    },
    {
        "input": "without liased <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "without liased car"
    },
    {
        "input": "how are you",
        "output": [
            "{\"Greet\":true}"
        ],
        "initial": "how are you"
    },
    {
        "input": "no chance only <VALUE> track is possible",
        "output": [
            "{\"Insist\":\"Promotion Possibilities\"}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "no chance only slow track is possible"
    },
    {
        "input": "okay, a <VALUE>",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}"
        ],
        "initial": "okay, a team manager"
    },
    {
        "input": "my offer is <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "my offer is 12000 nis"
    },
    {
        "input": "<VALUE> track <ATTRIBUTE> is fine",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "fast track promotion is fine"
    },
    {
        "input": "i will give you the <VALUE> <ATTRIBUTE> but nothing else.",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Project Manager\"}}"
        ],
        "initial": "i will give you the project manager job but nothing else."
    },
    {
        "input": "what is your <ATTRIBUTE>?",
        "output": [
            "{\"Query\":\"Job Description\"}"
        ],
        "initial": "what is your job?"
    },
    {
        "input": "please accept and sign",
        "output": [
            "{\"Query\":\"accept\"}"
        ],
        "initial": "please accept and sign"
    },
    {
        "input": "i ofeer <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i ofeer 7000"
    },
    {
        "input": "<ATTRIBUTE> <VALUE> and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "salary 12000 and 8 hours"
    },
    {
        "input": "you have to work at least <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "you have to work at least 9 hours"
    },
    {
        "input": "so we both agreement",
        "output": [
            "{\"Query\":\"accept\"}"
        ],
        "initial": "so we both agreement"
    },
    {
        "input": "only <VALUE> <ATTRIBUTE> is possible but we will promisse <VALUE> <ATTRIBUTE> track and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "only 10 hours is possible but we will promisse fast promotion track and 20% pension fund"
    },
    {
        "input": "what do you think about <VALUE>?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}"
        ],
        "initial": "what do you think about team manager?"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> a day is my final offer",
        "output": [
            "{\"Insist\":\"Working Hours\"}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "10 hours a day is my final offer"
    },
    {
        "input": "i am willing to pay that amount if you commit to working <VALUE> <ATTRIBUTE> for our company",
        "output": [
            "{\"Accept\":\"Salary\"}",
            "{\"Insist\":\"Working Hours\"}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "i am willing to pay that amount if you commit to working 10 hours for our company"
    },
    {
        "input": "no, only <VALUE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "no, only 0%"
    },
    {
        "input": "i accept",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "i accept"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> for <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "9 hours for 12000"
    },
    {
        "input": "we already agreed on <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "we already agreed on 12000"
    },
    {
        "input": "you are gooing to be a good <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "you are gooing to be a good programmer"
    },
    {
        "input": "you get <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "you get 7000 nis"
    },
    {
        "input": "how about <VALUE> nis, <VALUE>, <VALUE> <ATTRIBUTE> with <ATTRIBUTE>?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}",
            "{\"Offer\":{\"Salary\":\"20000\"}}"
        ],
        "initial": "how about 20000 nis, programmer, 10 pension fund with leased car?"
    },
    {
        "input": "<VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "12000"
    },
    {
        "input": "excellent.",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "excellent."
    },
    {
        "input": "<VALUE> but no <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Project Manager\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "project manager but no car"
    },
    {
        "input": "no, we agreed on <VALUE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}",
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "no, we agreed on 9"
    },
    {
        "input": "no <ATTRIBUTE> but <VALUE> <ATTRIBUTE> track",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "no car but fast promotion track"
    },
    {
        "input": "are you looking to be a <VALUE>?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Project Manager\"}}"
        ],
        "initial": "are you looking to be a project manager?"
    },
    {
        "input": "in the beggining you will get <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "in the beggining you will get 7000 nis"
    },
    {
        "input": "no;with <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "no;with leased car"
    },
    {
        "input": "that can be earned with time",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "that can be earned with time"
    },
    {
        "input": "i do not offer a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "i do not offer a leased car"
    },
    {
        "input": "okay please accept",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Query\":\"accept\"}"
        ],
        "initial": "okay please accept"
    },
    {
        "input": "for <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "for 8 hours"
    },
    {
        "input": "i would like to offer you a <ATTRIBUTE> in <VALUE> at <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"QA\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "i would like to offer you a job in qa at 12000"
    },
    {
        "input": "okay, <VALUE> <ATTRIBUTE> is acceptable",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "okay, 8 hours is acceptable"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> is middle of the orad",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}",
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "9 hours is middle of the orad"
    },
    {
        "input": "<VALUE> track",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "fast track"
    },
    {
        "input": "<VALUE> track",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "slow track"
    },
    {
        "input": "hi, does that sound good?",
        "output": [
            "{\"Greet\":true}",
            "{\"Query\":\"accept\"}"
        ],
        "initial": "hi, does that sound good?"
    },
    {
        "input": "without, please",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "without, please"
    },
    {
        "input": "you will not get a <ATTRIBUTE>",
        "output": [
            "{\"Reject\":\"Leased Car\"}"
        ],
        "initial": "you will not get a car"
    },
    {
        "input": "make it <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "make it fast promotion"
    },
    {
        "input": "agreed on <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"Working Hours\"}"
        ],
        "initial": "agreed on 8 hours"
    },
    {
        "input": "you can have the <ATTRIBUTE>, but no <ATTRIBUTE> at this time.",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Reject\":\"Leased Car\"}"
        ],
        "initial": "you can have the job, but no car at this time."
    },
    {
        "input": "i only have a <VALUE> position open",
        "output": [
            "{\"Insist\":\"Job Description\"}",
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "i only have a programmer position open"
    },
    {
        "input": "and no <ATTRIBUTE> <VALUE>",
        "output": [
            "{\"Append\":\"previous\"}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "and no car 10%"
    },
    {
        "input": "okay. but in this <ATTRIBUTE> no lissed <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "okay. but in this job no lissed car"
    },
    {
        "input": "i offer you <VALUE> hrs working",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "i offer you 10 hrs working"
    },
    {
        "input": "are you ready to sign",
        "output": [
            "{\"Query\":\"accept\"}"
        ],
        "initial": "are you ready to sign"
    },
    {
        "input": "i dont think so",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "i dont think so"
    },
    {
        "input": "i can offer a <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i can offer a 7000 nis"
    },
    {
        "input": "do we have an agreement",
        "output": [
            "{\"Query\":\"accept\"}"
        ],
        "initial": "do we have an agreement"
    },
    {
        "input": "no <ATTRIBUTE> is possible",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no leased car is possible"
    },
    {
        "input": "i will let you think about it again, my offer is <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Insist\":\"previous\"}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "i will let you think about it again, my offer is 9 hours"
    },
    {
        "input": "and we will throw in <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "and we will throw in 10% pension fund"
    },
    {
        "input": "but <VALUE> <ATTRIBUTE> is on",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "but fast promotion is on"
    },
    {
        "input": "<ATTRIBUTE> for <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "leased car for 9 hours"
    },
    {
        "input": "<ATTRIBUTE> <VALUE> and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "pension 20% and 10 hours"
    },
    {
        "input": "we are not prepared to offer a <ATTRIBUTE> with this position at this time.",
        "output": [
            "{\"Reject\":\"Leased Car\"}"
        ],
        "initial": "we are not prepared to offer a leased car with this position at this time."
    },
    {
        "input": "maybe <VALUE> ?",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "maybe 9 ?"
    },
    {
        "input": "<VALUE> nis, <VALUE> <ATTRIBUTE>, no <ATTRIBUTE>, <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "7000 nis, 10 hours, no car, programmer"
    },
    {
        "input": "i think <VALUE> is good",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i think 7000 is good"
    },
    {
        "input": "you can have <VALUE> nis for <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "you can have 7000 nis for leased car"
    },
    {
        "input": "fine, i agree",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "fine, i agree"
    },
    {
        "input": "<VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "12000 nis"
    },
    {
        "input": "would you be okay with working as a <VALUE>?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}"
        ],
        "initial": "would you be okay with working as a team manager?"
    },
    {
        "input": "how about <VALUE> nis, <VALUE>, no agreement on <ATTRIBUTE>, no agreement on <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"10,000 NIS\"}}",
            "{\"Offer\":{\"Job Description\":\"QA\"}}",
            "{\"Offer\":{\"Leased Car\":\"No agreement\"}}",
            "{\"Offer\":{\"Pension Fund\":\"No agreement\"}}"
        ],
        "initial": "how about 10000 nis, qa, no agreement on pension, no agreement on car"
    },
    {
        "input": "not <VALUE>",
        "output": [
            "{\"Reject\":\"Salary\"}"
        ],
        "initial": "not 20000"
    },
    {
        "input": "i am offering <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "i am offering leased car"
    },
    {
        "input": "atleast <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "atleast 9 hours"
    },
    {
        "input": "my last offer is <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Insist\":\"Working Hours\"}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "my last offer is 9 hours"
    },
    {
        "input": "i propose <VALUE> <ATTRIBUTE>, with <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "i propose 9 hours, with car"
    },
    {
        "input": "how about <VALUE> with nothing else",
        "output": [
            "{\"Offer\":{\"Salary\":\"20000\"}}"
        ],
        "initial": "how about 20000 with nothing else"
    },
    {
        "input": "our stand work day is <VALUE> <ATTRIBUTE> for all employees.",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "our stand work day is 10 hours for all employees."
    },
    {
        "input": "<VALUE> nis, <VALUE>, without <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, 10 <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Salary\":\"20000\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "20000 nis, team manager, without leased car, 10% pension, fast promotion, 10 working hours"
    },
    {
        "input": "<VALUE> nis, <VALUE>, with <ATTRIBUTE>, <VALUE> <ATTRIBUTE> <VALUE> <ATTRIBUTE> track, <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "12000 nis, programmer, with car, 20% pension slow promotion track, 9 hours"
    },
    {
        "input": "i'm sorry, i meant <VALUE>.",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Project Manager\"}}"
        ],
        "initial": "i'm sorry, i meant project manager."
    },
    {
        "input": "i think you should be a <VALUE>.",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "i think you should be a programmer."
    },
    {
        "input": "okay, <VALUE> , <VALUE>, without <ATTRIBUTE>, <VALUE> <ATTRIBUTE>,<VALUE> <ATTRIBUTE> track, but - <VALUE> <ATTRIBUTE> a day",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "okay, 7000 , programmer, without leased car, 20% pension,fast promotion track, but - 8 hours a day"
    },
    {
        "input": "<ATTRIBUTE>?",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "leased car?"
    },
    {
        "input": "yes, <VALUE> <ATTRIBUTE> track",
        "output": [
            "{\"Accept\":\"Promotion Possibilities\"}"
        ],
        "initial": "yes, fast promotion track"
    },
    {
        "input": "time is running out, so: <VALUE> , <VALUE>, with <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "time is running out, so: 12000 , programmer, with leased car, 0% pension, fast promotion, 9 hours"
    },
    {
        "input": "<VALUE> as agreed or nothing",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "12000 as agreed or nothing"
    },
    {
        "input": "with <VALUE> <ATTRIBUTE> you can get a <ATTRIBUTE>.",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "with 10% pension you can get a car."
    },
    {
        "input": "yes we can",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "yes we can"
    },
    {
        "input": "i will add a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "i will add a leased car"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> in the beggining",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "10 hours in the beggining"
    },
    {
        "input": "<ATTRIBUTE> but <VALUE> <ATTRIBUTE> track",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "leased car but slow promotion track"
    },
    {
        "input": "i can not offer a <ATTRIBUTE> but can offer you a <VALUE> <ATTRIBUTE> track",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "i can not offer a car but can offer you a fast promotion track"
    },
    {
        "input": "no agrrement",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "no agrrement"
    },
    {
        "input": "anf <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Append\":\"previous\"}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "anf 9 hours"
    },
    {
        "input": "<VALUE> hrs per day",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "10 hrs per day"
    },
    {
        "input": "<VALUE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "10%"
    },
    {
        "input": "i reject that idea",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "i reject that idea"
    },
    {
        "input": "okay you can have <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"20000\"}}"
        ],
        "initial": "okay you can have 20000"
    },
    {
        "input": "you can work for <VALUE> h so you will get mor mony",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "you can work for 10 h so you will get mor mony"
    },
    {
        "input": "<VALUE> nis with <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "7000 nis with car"
    },
    {
        "input": "then i think you should think our offer over and let me know whether you are interested in the position with no <ATTRIBUTE>.",
        "output": [
            "{\"Insist\":\"previous\"}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "then i think you should think our offer over and let me know whether you are interested in the position with no car."
    },
    {
        "input": "<VALUE> track is what i have",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "slow track is what i have"
    },
    {
        "input": "with <VALUE> nis we can give you a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "with 7000 nis we can give you a car"
    },
    {
        "input": "<VALUE> <ATTRIBUTE>e is not enough",
        "output": [
            "{\"Reject\":\"Working Hours\"}"
        ],
        "initial": "8 hourse is not enough"
    },
    {
        "input": "i can not give you a <ATTRIBUTE> proposal when we did not agree on your <ATTRIBUTE> and <ATTRIBUTE> per day.",
        "output": [
            "{\"Reject\":\"Job Description\"}",
            "{\"Reject\":\"Job Description\"}",
            "{\"Reject\":\"Working Hours\"}"
        ],
        "initial": "i can not give you a salary proposal when we did not agree on your job description and hours per day."
    },
    {
        "input": "i would only offer <VALUE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}",
            "{\"Insist\":\"Working Hours\"}"
        ],
        "initial": "i would only offer 10"
    },
    {
        "input": "okay let's compromise on <VALUE> <ATTRIBUTE> per day.",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}",
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "okay let's compromise on 9 hours per day."
    },
    {
        "input": "my suggestion is <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "my suggestion is 7000 nis"
    },
    {
        "input": "i am offering you a <VALUE> position that starts at <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "i am offering you a team manager position that starts at 12000 nis"
    },
    {
        "input": "a <VALUE> does not have a <ATTRIBUTE>, i'm afraid",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "a programmer does not have a leased car, i'm afraid"
    },
    {
        "input": "i  offer <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "i  offer 10% pension"
    },
    {
        "input": "the best i can do is <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "the best i can do is 12000"
    },
    {
        "input": "i will give you <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i will give you 7000 nis"
    },
    {
        "input": "no i can not agree to <ATTRIBUTE>",
        "output": [
            "{\"Reject\":\"Leased Car\"}"
        ],
        "initial": "no i can not agree to leased car"
    },
    {
        "input": "hi",
        "output": [
            "{\"Greet\":true}"
        ],
        "initial": "hi"
    },
    {
        "input": "<VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "7000 nis"
    },
    {
        "input": "so <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "so 10 hours"
    },
    {
        "input": "i'm sorry, <VALUE> is only for expeirenced",
        "output": [
            "{\"Reject\":\"Job Description\"}"
        ],
        "initial": "i'm sorry, project manager is only for expeirenced"
    },
    {
        "input": "hi what is your skills",
        "output": [
            "{\"Greet\":true}"
        ],
        "initial": "hi what is your skills"
    },
    {
        "input": "<ATTRIBUTE> <VALUE> , no <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "pension 10 , no car, 9 hours, fast promotion"
    },
    {
        "input": "<VALUE> nis?",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "12000 nis?"
    },
    {
        "input": "nope about to opt out",
        "output": [
            "{\"Quit\":true}"
        ],
        "initial": "nope about to opt out"
    },
    {
        "input": "no agreement then on <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"No agreement\"}}"
        ],
        "initial": "no agreement then on pension"
    },
    {
        "input": "you can not get it all!",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "you can not get it all!"
    },
    {
        "input": "without a <ATTRIBUTE>, with <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "without a car, with fast promotion"
    },
    {
        "input": "what <ATTRIBUTE> are you looking for?",
        "output": [
            "{\"Query\":\"Job Description\"}"
        ],
        "initial": "what job are you looking for?"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> then and we close a deal",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "9 hours then and we close a deal"
    },
    {
        "input": "no <ATTRIBUTE> for now",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no car for now"
    },
    {
        "input": "no <ATTRIBUTE>!!!",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no car!!!"
    },
    {
        "input": "think it over.  its a good <ATTRIBUTE>, and a good offer.",
        "output": [
            "{\"Insist\":\"previous\"}"
        ],
        "initial": "think it over.  its a good job, and a good offer."
    },
    {
        "input": "<VALUE> <ATTRIBUTE> final",
        "output": [
            "{\"Insist\":\"previous\"}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "9 hours final"
    },
    {
        "input": "what about <VALUE> without a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "what about 12000 without a car"
    },
    {
        "input": "you will work <VALUE> <ATTRIBUTE> a day",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "you will work 10 hours a day"
    },
    {
        "input": "working <VALUE> hrs",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "working 10 hrs"
    },
    {
        "input": "i can also provide <ATTRIBUTE>",
        "output": [
            "{\"Append\":\"previous\"}"
        ],
        "initial": "i can also provide pension"
    },
    {
        "input": "salart <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "salart 7000 nis"
    },
    {
        "input": "with a <VALUE> <ATTRIBUTE>, a <VALUE> <ATTRIBUTE> track and a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "with a 10% pension fund, a fast promotion track and a leased car"
    },
    {
        "input": "<ATTRIBUTE>, no <ATTRIBUTE>, <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"QA\"}}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}"
        ],
        "initial": "leased car, no pension, qa"
    },
    {
        "input": "what are you willing to compromise about, since i wanyt you to work <VALUE> <ATTRIBUTE>.",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}",
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "what are you willing to compromise about, since i wanyt you to work 10 hours."
    },
    {
        "input": "<VALUE> gets <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "team manager gets 12000 nis"
    },
    {
        "input": "oka",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "oka"
    },
    {
        "input": "its a little bit high dont you think?",
        "output": [
            "{\"Reject\":\"Salary\"}"
        ],
        "initial": "its a little bit high dont you think?"
    },
    {
        "input": "you understand right",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "you understand right"
    },
    {
        "input": "go get another <ATTRIBUTE>",
        "output": [
            "{\"Quit\":true}"
        ],
        "initial": "go get another job"
    },
    {
        "input": "i am willing to compromise on a <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}",
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "i am willing to compromise on a 20% pension fund"
    },
    {
        "input": "and i agree if you work <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "and i agree if you work 9 hours"
    },
    {
        "input": "<VALUE> hrs",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "10 hrs"
    },
    {
        "input": "okay. my offer is: <VALUE> <ATTRIBUTE> a day, <VALUE>, without <ATTRIBUTE>, no <ATTRIBUTE>, <VALUE> <ATTRIBUTE> track.",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "okay. my offer is: 8 hours a day, programmer, without leased car, no pension fund, slow promotion track."
    },
    {
        "input": "<VALUE> nis!",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "7000 nis!"
    },
    {
        "input": "no <ATTRIBUTE>. use your own car.",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no leased car. use your own car."
    },
    {
        "input": "<VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "9 hours"
    },
    {
        "input": "i can give you <VALUE> nis with a <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i can give you 7000 nis with a car"
    },
    {
        "input": "i'm offering a <ATTRIBUTE>: <VALUE>, <VALUE> <ATTRIBUTE> a day, <VALUE> , no <ATTRIBUTE>, <VALUE> <ATTRIBUTE> track",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "i'm offering a job: programmer, 10 hours a day, 12000 , no car, fast promotion track"
    },
    {
        "input": "<VALUE>?",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "10%?"
    },
    {
        "input": "hey",
        "output": [
            "{\"Greet\":true}"
        ],
        "initial": "hey"
    },
    {
        "input": "i told you, lets start with something small, like <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "i told you, lets start with something small, like programmer"
    },
    {
        "input": "okay, perhaps we should end negotiation",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "okay, perhaps we should end negotiation"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> is fine",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "8 hours is fine"
    },
    {
        "input": "i offer a <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"QA\"}}"
        ],
        "initial": "i offer a qa"
    },
    {
        "input": "<VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "7000 nis"
    },
    {
        "input": "sorry that is final",
        "output": [
            "{\"Insist\":\"previous\"}"
        ],
        "initial": "sorry that is final"
    },
    {
        "input": "and you get a <ATTRIBUTE>",
        "output": [
            "{\"Append\":\"previous\"}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "and you get a car"
    },
    {
        "input": "<VALUE> <ATTRIBUTE> ?",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "10 hours ?"
    },
    {
        "input": "hi, my name is john and i will po<VALUE> tially be your new employer.",
        "output": [
            "{\"Greet\":true}"
        ],
        "initial": "hi, my name is john and i will po10 tially be your new employer."
    },
    {
        "input": "i offer <VALUE> for <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "i offer 10 for pension"
    },
    {
        "input": "for <VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"12000\"}}"
        ],
        "initial": "for 12000"
    },
    {
        "input": "you need to be a <VALUE> <ATTRIBUTE> title",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "you need to be a programmer job title"
    },
    {
        "input": "you are working <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "you are working 10 hours"
    },
    {
        "input": "okay , <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "okay , 8 hours"
    },
    {
        "input": "every work is <VALUE> hrs",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "every work is 9 hrs"
    },
    {
        "input": "no <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}"
        ],
        "initial": "no leased car"
    },
    {
        "input": "i offer a <ATTRIBUTE> of <VALUE> nis",
        "output": [
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "i offer a salary of 7000 nis"
    },
    {
        "input": "since your are working <VALUE> <ATTRIBUTE>, no <ATTRIBUTE>.",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "since your are working 8 hours, no leased car."
    },
    {
        "input": "okay, with <ATTRIBUTE>.",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "okay, with leased car."
    },
    {
        "input": "there will be no <ATTRIBUTE>. you will only recieve a car if you work <VALUE> hour days",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "there will be no car. you will only recieve a car if you work 10 hour days"
    },
    {
        "input": "<ATTRIBUTE> is only possible with <VALUE> and <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}"
        ],
        "initial": "leased car is only possible with programmer and 10% pension"
    },
    {
        "input": "whice <ATTRIBUTE> do you want?",
        "output": [
            "{\"Query\":\"Job Description\"}"
        ],
        "initial": "whice job do you want?"
    },
    {
        "input": "<VALUE> nis, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> track, no <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}",
            "{\"Offer\":{\"Salary\":\"12000\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "12000 nis, 8 hours, 0% pension, slow track, no car"
    },
    {
        "input": "sorry dude",
        "output": [
            "{\"Reject\":\"previous\"}"
        ],
        "initial": "sorry dude"
    },
    {
        "input": "if you will be good as you say you are, <VALUE> pormotion track is an option",
        "output": [
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "if you will be good as you say you are, fast pormotion track is an option"
    },
    {
        "input": "how about <VALUE>, <VALUE> , without <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE> track, <VALUE> <ATTRIBUTE> a day?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}",
            "{\"Offer\":{\"Salary\":\"20000\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "how about programmer, 20000 , without leased car, 0% pension fund, slow promotion track, 10 hours a day?"
    },
    {
        "input": "okay",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "okay"
    },
    {
        "input": "i will agree for <VALUE> <ATTRIBUTE> if you will be a programer",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "i will agree for 8 hours if you will be a programer"
    },
    {
        "input": "come on, dont be so hard",
        "output": [
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "come on, dont be so hard"
    },
    {
        "input": "<VALUE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}"
        ],
        "initial": "0%"
    },
    {
        "input": "this is a <VALUE> <ATTRIBUTE> track, you will start with <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"10%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"fast\"}}"
        ],
        "initial": "this is a fast promotion track, you will start with 10% pension"
    },
    {
        "input": "is this good enough?",
        "output": [
            "{\"Query\":\"accept\"}"
        ],
        "initial": "is this good enough?"
    },
    {
        "input": "all i have is a <VALUE> position",
        "output": [
            "{\"Insist\":\"Job Description\"}",
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "all i have is a programmer position"
    },
    {
        "input": "you will work <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "you will work 10 hours"
    },
    {
        "input": "<VALUE>",
        "output": [
            "{\"Offer\":{\"Salary\":\"10,000 NIS\"}}"
        ],
        "initial": "10000"
    },
    {
        "input": "actually, i had in mind offering you a <VALUE>s <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "actually, i had in mind offering you a programmers job"
    },
    {
        "input": "what offer do you not accept?",
        "output": [
            "{\"Query\":\"issues\"}"
        ],
        "initial": "what offer do you not accept?"
    },
    {
        "input": "let's compromise you be a <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Query\":\"compromise\"}"
        ],
        "initial": "let's compromise you be a programmer"
    },
    {
        "input": "how about <VALUE>, <VALUE> , without <ATTRIBUTE>, <VALUE> <ATTRIBUTE>, <VALUE> <ATTRIBUTE> track, <VALUE> <ATTRIBUTE> a day?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Pension Fund\":\"0%\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}",
            "{\"Offer\":{\"Salary\":\"20000\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "how about programmer, 20000 , without leased car, 0% pension fund, slow promotion track, 9 hours a day?"
    },
    {
        "input": "for <VALUE> i want a hard working employee who can commit to <VALUE> <ATTRIBUTE>. otherwise the answer is no",
        "output": [
            "{\"Offer\":{\"Salary\":\"20000\"}}",
            "{\"Offer\":{\"Working Hours\":\"10\"}}"
        ],
        "initial": "for 20000 i want a hard working employee who can commit to 10 hours. otherwise the answer is no"
    },
    {
        "input": "what do you think about <VALUE>?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "what do you think about programmer?"
    },
    {
        "input": "<VALUE> is good for you ?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "programmer is good for you ?"
    },
    {
        "input": "how about <VALUE> or <VALUE>?",
        "output": [
            "{\"Offer\":{\"Job Description\":\"QA\"}}",
            "{\"Offer\":{\"Job Description\":\"Team Manager\"}}"
        ],
        "initial": "how about qa or team manager?"
    },
    {
        "input": "i can offer <VALUE> <ATTRIBUTE> track but no <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"Without leased car\"}}",
            "{\"Offer\":{\"Promotion Possibilities\":\"slow\"}}"
        ],
        "initial": "i can offer slow promotion track but no car"
    },
    {
        "input": "i can do <VALUE> <ATTRIBUTE>, but only if you work as a <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}",
            "{\"Offer\":{\"Working Hours\":\"8\"}}"
        ],
        "initial": "i can do 8 hours, but only if you work as a programmer"
    },
    {
        "input": "while you think let's talk about the position. i need a <VALUE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Programmer\"}}"
        ],
        "initial": "while you think let's talk about the position. i need a programmer"
    },
    {
        "input": "now get out please\\",
        "output": [
            "{\"Quit\":true}"
        ],
        "initial": "now get out please\\"
    },
    {
        "input": "we can sign the agreement then.",
        "output": [
            "{\"Accept\":\"previous\"}",
            "{\"Query\":\"accept\"}"
        ],
        "initial": "we can sign the agreement then."
    },
    {
        "input": "<VALUE>",
        "output": [
            "{\"Offer\":{\"Pension Fund\":\"20%\"}}"
        ],
        "initial": "20%"
    },
    {
        "input": "<VALUE> nis is final",
        "output": [
            "{\"Insist\":\"Salary\"}",
            "{\"Offer\":{\"Salary\":\"7000\"}}"
        ],
        "initial": "7000 nis is final"
    },
    {
        "input": "<VALUE> and work <VALUE> <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Job Description\":\"Project Manager\"}}",
            "{\"Offer\":{\"Working Hours\":\"9\"}}"
        ],
        "initial": "project manager and work 9 hours"
    },
    {
        "input": "agreed",
        "output": [
            "{\"Accept\":\"previous\"}"
        ],
        "initial": "agreed"
    },
    {
        "input": "with <ATTRIBUTE>",
        "output": [
            "{\"Offer\":{\"Leased Car\":\"With leased car\"}}"
        ],
        "initial": "with leased car"
    },
    {
        "input": "then it is a no on the <ATTRIBUTE>",
        "output": [
            "{\"Reject\":\"Salary\"}"
        ],
        "initial": "then it is a no on the salary"
    }
]
