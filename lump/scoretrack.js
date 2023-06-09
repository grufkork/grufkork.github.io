function saveScore(title, name, score, data){
	if(localStorage[title] == undefined){
		localStorage[title] = JSON.stringify({name: "", score: -99999999999});
	}
	let s = JSON.parse(localStorage[title])
	if(score >= s.score){
		localStorage[title] = JSON.stringify({name: name, score: score, data: data});
		return true;
	}
	return false;
}

function getScore(title){
	if(localStorage[title] == undefined){
		saveScore(title, "NONE", -9999999999, undefined);
	}
	return JSON.parse(localStorage[title]);
}