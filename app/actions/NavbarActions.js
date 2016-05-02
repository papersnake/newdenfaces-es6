import alt from '../alt';
import {assign} from 'lodash';

class NavbarActions {
	constructor() {
		this.generateActions(
			'updateOnlineUsers',
			'updateAjaxAnimation',
			'updateSearchQuery',
			'getCharacterCountSuccess',
			'getCharacterCountFail',
			'findCharacterSuccess',
			'findCharacterFail'
			);
	}

	findCharacter(payload) {
		$.ajax({
			url:'/api/characters/search',
			data: {name: payload.searchQuery}
		})
			.done((data) => {
				assign(payload,data);
				this.actions.findCharacterSuccess(payload);
			})
			.fail(() => {
				this.actions.findCharacterFail(payload);
			});
	}

	getCharacterCount() {
		$.ajax({ url: '/api/characters/count' })
			.done((data) => {
				this.actions.getCharacterCountSuccess(data)
			})
			.fail((jqXhr) => {
				this.actions.getCharacterCountFail(jqXHr)
			});
	}
}

export default alt.createActions(NavbarActions);