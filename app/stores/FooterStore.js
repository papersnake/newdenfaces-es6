import alt from '../alt';
import FooterActions from '../actions/FooterActions';

class FooterStore {
	constructor() {
		this.bindActions(FooterActions);
		this.characters = [];
	}

	onGetTopCharactersSuccess(data) {
		if(typeof data =="object" && dara.construcotr == Array){
			this.characters = data.slice(0,5);
		}
	}

	onGetTopCharactersFail(jqXhr) {
		toastr.error(jqXhr.responseJSON && jqXhr.responseJSON.message || jqXhr.responseText || jqXhr.statusText);
	}
}

export default alt.createStore(FooterStore);