export default {
	contentFile: "/content.json",
	listTemplate: "/templates/list.njk",
	detailTemplate: "/templates/detail.njk",
	navTemplate: "/templates/nav-slide.njk",

	getList: async function(url) {
		console.log(url + this.contentFile);
		let response = await fetch(url + this.contentFile);

		if (response.ok) { // если HTTP-статус в диапазоне 200-299
		  // получаем тело ответа (см. про этот метод ниже)
		  let json = await response.json();
		  return json;
		} else {
		  console.log("Ошибка HTTP: " + response.status);
		}
	},

	getId: async function(url, id) {
		const json = this.getList(url);
		return json['items'][id];
	},

	renderList: async function(url) {
    	const response = await fetch(url + this.listTemplate);
		const tpl = await response.text();
		const content = await this.getList(url);
		return nunjucks.renderString(tpl, content);
    },

    renderNav: async function(url) {
    	const response = await fetch(url + this.navTemplate);
		const tpl = await response.text();
		const content = await this.getList(url);
		return nunjucks.renderString(tpl, content);
    },

    renderDetail: async function(url, id) {
    	const response = await fetch(url + this.detailTemplate);
    	const nav = await fetch(url + this.navTemplate);
		const tpl = await response.text();
		const navTpl = await nav.text();
		const content = await this.getList(url);
		const item = content['items'][id];
		const resp = await fetch(url + "/" + item.text);
		let txt = await resp.text();
		item.text = txt.replace(/\u2028/g," ");
		item.id = content.id = parseInt(id);
		return nunjucks.renderString(navTpl, {baseUrl: url, items: content['items'], id: id}) + nunjucks.renderString(tpl, item);
    }
}