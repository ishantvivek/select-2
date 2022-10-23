/* 
 select2.js is a library of custom dropdown with a lot of features and customisations using Shadow-dom.
 It targets mostly on themes and server side data load.

 USAGE:
   Element name: <select-2></select-2>
   Parameters:
    - data: Supports adding of local data in array of objects with key name "key" and value name "value"
      E.g: [{ "value" : "Ishant", "key": "ish"}, {"value" : "Vivek", "key": "viv"}]
    - theme: Upcoming(yet to be added)
    - config: JSON of configuratons
      -- search: true/false, if want to make it searchable
      -- filter: "ci" for case insensitive search
      -- url: to load data from server
*/

const select2 =  {
    createContainer: () => {
        const container = document.createElement('div');
        container.className = 'container';
        container.setAttribute('tabindex', 0);
        return container;
    },

    createValue:  (data, that = {}) => {
        const val = document.createElement('span');
        val.className = 'value';
        val.value = data?.[0]?.value;
        that.value = data?.[0]?.value;
        val.textContent = data?.[0]?.value || 'Select';
        return val;
    },

    createButton: () => {
        const button = document.createElement('button');
        button.className = 'cross-btn';
        button.textContent = 'x';
        return button;
    },

    createDivider: () => {
        const divider = document.createElement('div');
        divider.className = 'divider';

        return divider;
    },

    createCaret: () => {
        const caret = document.createElement('div');
        caret.className = 'caret';

        return caret;
    },

    createList: (data, config) => {
        // create ul
        const ul = document.createElement('ul');
        ul.className = 'options';

        // only show input if search feature is on
        if (config.search) {
            const input = document.createElement('input');
            input.className = 'input';
            input.type = 'text';
            ul.appendChild(input);
        }

        //create data list
        for (i in data) {
            const li = select2.createLi(data[i].key, data[i].value)
            ul.appendChild(li);
        }
        return ul;
    },

    createLi: (key, value) => {
        const li = document.createElement('li');
        li.className = 'option';
        li.setAttribute('label', key);
        li.val = value;
        li.textContent = value;
        return li;
    },

    createStyle: (href = undefined) => {
        const style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('href', href || 'select2.css');
        return style;
    },

    createSelect2: (data, config, that={}) => {
        const container = select2.createContainer();
        container.appendChild(select2.createValue(data, that));
        container.appendChild(select2.createButton());
        container.appendChild(select2.createDivider());
        container.appendChild(select2.createCaret());
        container.appendChild(select2.createList(data, config));
        return container;
    }
};

class Select2 extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        this.initialise(this);
    }

    initialise(that) {
        // Appends the style for shadow dom
        const style = select2.createStyle();
        this.shadowRoot.appendChild(style);

        // fetch config from select-2 element
        const config = JSON.parse(that.getAttribute('config'));

        // based on config fetch or initialise the data for select-2
        let initSelect2;
        if(config.url) {
            this.fetchData(config.url)
            .then((data) => {
                initSelect2 = select2.createSelect2(data, config, this);
                this.shadowRoot.appendChild(initSelect2);
                this.addEventListeners(data, config);
            });
        } else {
            const data = this.getAttribute('data') && JSON.parse(this.getAttribute('data'));
            select2 = select2.createSelect2(data, config, this);
            this.shadowRoot.appendChild(select2);
            this.addEventListeners(data, config);
        }
    }

    async fetchData(url) {
        const response = await fetch(url);
        return response.json();
    }

    addEventListeners(data = [], config = {}) {
        const container = this.shadowRoot.querySelector('.container');
        const cross = this.shadowRoot.querySelector('.cross-btn');
        const value = this.shadowRoot.querySelector('.value');
        const options = this.shadowRoot.querySelector('.options');

        container.addEventListener('blur', (e) => {
            if (e.relatedTarget?.className !== 'input') // don't remove when target is input and clicked
                options.classList.remove('show');
        });

        container.addEventListener('click', (e) => {
            const option = this.shadowRoot.querySelectorAll('.option');
            [...option]
                .filter((a) => a.className == 'option')
                .forEach((elem) => {
                    if(elem.val === value.value)
                        elem?.classList.toggle('selected');
                });
            options.classList.toggle('show');
        });

        cross.addEventListener('click', (e) => {
            const option = this.shadowRoot.querySelectorAll('.option');
            e.stopPropagation();
            value.value = '';
            value.innerText = '';
            this.value = '';
            [...options.childNodes]
                .filter((a) => a.classList.contains('selected'))
                .forEach((elem) => {
                    elem?.classList.remove('selected');
                });
            options.classList.remove('show');
            if (config.search) {
                option.forEach((element) => element.remove());
                for (const i in data)
                    options.appendChild(
                        select2.createLi(data[i].key, data[i].value)
                    );
                this.shadowRoot.querySelector('.input').value = '';
            }
        });

        this.shadowRoot
            .querySelector('ul')
            .addEventListener('mouseover', (e) => {
                if (e.target.tagName.toLowerCase() === 'li')
                    e.target.classList.toggle('highlighted');
            });

        this.shadowRoot
            .querySelector('ul')
            .addEventListener('mouseout', (e) => {
                if (e.target.tagName.toLowerCase() === 'li')
                    e.target.classList.toggle('highlighted');
            });

        this.shadowRoot.querySelector('ul').addEventListener('click', (e) => {
            e.stopPropagation();
            const option = this.shadowRoot.querySelectorAll('.option');
            if (e.target.tagName.toLowerCase() === 'li') {
                [...option].filter((a) => a.classList.contains('selected'))
                    .forEach((elem) => {
                        elem?.classList.remove('selected');
                    });
                if (e.target.val !== value.value)
                    e.target.classList.toggle('selected');
                value.value = e.target.val;
                value.innerText = e.target.val;
                this.value = e.target.val;
                options.classList.toggle('show');
            }
        });

        if (config.search) {
            const input = this.shadowRoot.querySelector('.input');
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('input', (e) => {
                const option = this.shadowRoot.querySelectorAll('.option');
                option.forEach((element) => element.remove());
                const searchValue = config.filter == 'ci'
                                      ? new RegExp(e.target.value, 'i')
                                      : e.target.value;
                const newData = data && data.filter((a) => a.value?.match(searchValue));
                for (const i in newData)
                    options.appendChild(
                        select2.createLi(
                            newData[i].key,
                            newData[i].value
                        )
                    );
            });
        }
    }
}

customElements.define('select-2', Select2);
