// Copyright (c)2021 Quinn Michaels
// The Rig Veda Deva
const fs = require('fs');
const path = require('path');
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  dir: __dirname,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};

const {agent,vars,rigveda} = require('./data');

const Deva = require('@indra.ai/deva');
const VEDA = new Deva({
  info,
  agent,
  vars,
  utils: require('./utils.js'),
  listeners: {},
  modules: {},
  deva: {},
  func: {
    /**************
    func: books
    params: packet
    describe: Return a listiig of the Rig Veda Books.
    ***************/
    books() {
      return new Promise((resolve, reject) => {
        try {
          const agent = this.agent();
          const {id, title, describe, DATA} = rigveda.index;
          const _text = [
            `::begin:${agent.key}:${id}`,
            `## ${title}`,
            `p: ${describe}`,
            '::begin:menu',
          ];
          const _books = [];
          // loop over the data and format it into a feecting command string
          DATA.forEach((book, idx) => {
            _books.push(`button[${book.title}]:#${agent.key} book ${book.key}`);
          });
          const _booksText = _books.join('\n');
          const _booksHash = this.hash(_booksText);
          _text.push(_booksText);
          _text.push(`::end:menu`);
          _text.push(`::end:${agent.key}:${_booksHash}`);
          _text.push(`::begin:hidden`);
          _text.push(`#color = ::agent_color::`);
          _text.push(`#bgcolor = ::agent_bgcolor::`);
          _text.push(`#bg = ::agent_background::`);
          _text.push(`::end:hidden`);
          return this.finish({
            id,
            text: _text.join('\n'),
            html: false,
            data: {
              title,
              describe,
              books: DATA,
              hash: this.hash(JSON.stringify(DATA)),
            },
            created: Date.now(),
          }, resolve);
        } catch (e) {
          return reject(e);
        }
      });
    },
    /***********
    func: book
    params: packet
    describe: The book function calls the public facing api to get a listing of books to list to the user. originally this file came from sacred-texts.com but was migrated to indra.church with a json api.
    ***********/
    book(text) {
      return new Promise((resolve, reject) => {
        if (!text) return resolve(this.vars.messages.nobook);
        try {
          const agent = this.agent();
          const key = text.length < 2 ? `0${text}` : text;
          const {id, title, describe, DATA} = require(`./data/rigveda/${key}.json`);

          const _text = [
            `::begin:${agent.key}:${id}`,
            `## ${title}`,
            `p: ${describe}`,
            '::begin:menu',
          ];
          const _hymns = [];
          DATA.forEach((hymn, idx) => {
            _hymns.push(`button[${hymn.key} - ${hymn.title}]:#${agent.key} hymn ${hymn.key}`);
          });
          const _hymnsText = _hymns.join('\n');
          const _hymnsHash = this.hash(_hymnsText);
          _text.push(_hymnsText);
          _text.push(`::end:menu`);
          _text.push(`::end:${agent.key}:${_hymnsHash}`);
          _text.push(`::begin:hidden`);
          _text.push(`#color = ::agent_color::`);
          _text.push(`#bgcolor = ::agent_bgcolor::`);
          _text.push(`#bg = ::agent_background::`);
          _text.push(`::end:hidden`);

          return this.finish({
            id,
            text: _text.join('\n'),
            html: false,
            data: {
              title,
              describe,
              hymns: DATA,
              hash: this.hash(JSON.stringify(DATA)),
            },
            created: Date.now(),
          }, resolve);
        } catch (e) {
          return reject(e);
        }
      });
    },

    /**************
    func: hymn
    params: packet
    describe: The View function returns a specific hymn from one of the Books.
    ***************/
    hymn(h) {
      return new Promise((resolve, reject) => {
        if (!h) return resolve(this._messages.notext);
        const id = this.uid();
        const agent = this.agent();

        try {
          const hymnPath = path.join(__dirname, 'data', 'rigveda', 'hymns', `${h}.json`);
          const hymnExists = fs.existsSync(hymnPath);
          if (!hymnExists) return resolve(this.vars.messages.notfound);
          // parse hymns
          const theFile = fs.readFileSync(hymnPath);
          const _hymn = JSON.parse(theFile);
          const processed = this.utils.process(_hymn.orig);

          const hymn = [
            `::begin:hymn:${processed.key}`,
            `## ${processed.title}`,
            '::begin:content',
            processed.text,
            '::end:content',
          ];
          hymn.push(`::begin:meta`);
          if (processed.people.length) {
            hymn.push(`people: ${processed.people.join(' ')}`);
          }
          if (processed.places.length) {
            hymn.push(`places: ${processed.places.join(' ')}`);
          }
          if (processed.things.length) {
            hymn.push(`things: ${processed.things.join(' ')}`);
          }
          if (processed.groups.length) {
            hymn.push(`groups: ${processed.groups.join(' ')}`);
          }
          if (processed.concepts.length) {
            hymn.push(`concepts: ${processed.concepts.join(' ')}`);
          }
          hymn.push('::begin:buttons');
          hymn.push(`button[Speak Hymn]:${this.askChr}veda speak ${processed.key}`);
          hymn.push(`button[Arjika Enclosure]:${this.askChr}docs view arjika/${processed.book}`);
          hymn.push('::end:buttons');
          hymn.push('::end:meta');
          hymn.push(`::end:hymn:${processed.hash}`);
          hymn.push(`::begin:hidden`);
          hymn.push(`#color = ::agent_color::`);
          hymn.push(`#bgcolor = ::agent_bgcolor::`);
          hymn.push(`#bg = ::agent_background::`);
          hymn.push(`::end:hidden`);

          return resolve({
            id,
            key: processed.key,
            book: processed.book,
            text: hymn.join('\n'),
            html:false,
            data: processed,
            created: Date.now(),
          });
        } catch (e) {
          return reject(e);
        }
      });
    },
    learnSetup(book=0) {
      this.vars.learn.books = rigveda.books.map(bk => bk.key);
      this.vars.learn.book = book;
      this.vars.learn.hymns = rigveda.books[this.vars.learn.book].DATA.map(itm => itm.key);
      this.vars.learn.hymn1 = this.vars.learn.hymns.shift();
      this.vars.learn.hymn2 = this.vars.learn.hymns.shift();
      this.vars.learn.hymn3 = this.vars.learn.hymns.shift();
      return true;
    },
    learnHymns() {
      const { learn } = this.vars;
      this.vars.learn.training = []; // set the training array for the current learn.
      if (!learn.hymns.length) {
        const nextBookIndex = learn.book + 1 === rigveda.books.length ? 0 : learn.book + 1;
        this.func.learnSetup(nextBookIndex);
      }
      else {
        this.vars.learn.hymn1 = this.vars.learn.hymn2;
        this.vars.learn.hymn2 = this.vars.learn.hymn3;
        this.vars.learn.hymn3 = this.vars.learn.hymns.shift();
      }
      return true;
    },

    learn() {
      return new Promise((resolve, reject) => {
        this.prompt(`hymns: ${this.vars.learn.hymn1} ${this.vars.learn.hymn1} ${this.vars.learn.hymn1}`)
        this.prompt(`get hymn 1: ${this.vars.learn.hymn1}`)
        this.func.hymn(this.vars.learn.hymn1).then(hymn1 => {
          this.vars.learn.training.push(hymn1.data);
          this.prompt(`get hymn 2: ${this.vars.learn.hymn2}`)
          return this.func.hymn(this.vars.learn.hymn2)
        }).then(hymn2 => {
          this.vars.learn.training.push(hymn2.data);
          this.prompt(`get hymn 3: ${this.vars.learn.hymn3}`)
          return this.func.hymn(this.vars.learn.hymn3)
        }).then(hymn3 => {
          this.vars.learn.training.push(hymn3.data);
          const text = [];

          this.vars.learn.training.forEach((item, index) => {
            if (!item) return;
            const hymn = [
              `::begin:hymn:${item.key}`,
              this.trimWords(item.text, 150),
              `::end:hymn:${this.hash(item.text)}`,
            ]
            const info = [
              `people: ${item.people.join(', ')}`,
              `places: ${item.places.join(', ')}`,
              `things: ${item.things.join(', ')}`,
              `groups: ${item.groups.join(', ')}`,
              `concepts: ${item.concepts.join(', ')}`,
            ]
            info.unshift(`::begin:info:${item.key}`);
            info.push(`::end:info:${this.hash(info.join('\n'))}`);
            text.push(hymn.join('\n'));
            text.push(info.join('\n'));
          });
          return resolve({
            text: text.join('\n'),
            html: false,
            data: this.vars.learn,
          });
        }).catch(reject)
      });
    },

  },
  methods: {
    /**************
    method: books
    params: packet
    describe: Call the books function to get a listing of books.
    ***************/
    books(packet) {
      this.context('books');
      return new Promise((resolve, reject) => {
        if (!packet) return reject(this._messages.nopacket);
        let data;
        this.func.books().then(books => {
          data = books;
          return this.question(`#feecting parse:${this.agent.key} ${books.text}`)
        }).then(feecting => {
          return resolve({
            text:feecting.a.text,
            html:feecting.a.html,
            data,
          });
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      })
    },

    /**************
    method: book
    params: packet
    describe: call the book function to get the contents of a book
    ***************/
    book(packet) {
      return new Promise((resolve, reject) => {
        if (!packet) return reject(this._messages.nopacket);
        this.context('book', packet.q.text);
        const agent = this.agent();
        let data;
        this.func.book(packet.q.text).then(book => {
          data = book;
          return this.question(`#feecting parse:${agent.key} ${book.text}`);
        }).then(feecting => {
          return resolve({
            text:feecting.a.text,
            html:feecting.a.html,
            data,
          });
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      });
    },

    /**************
    method: hymn
    params: packet
    describe: Call the hymn function to read a specific book
    ***************/
    hymn(packet) {
      return new Promise((resolve, reject) => {
        if (!packet) return reject(this._messages.nopacket);
        this.context('hymn', packet.q.text);
        const agent = this.agent();
        let data;
        this.func.hymn(packet.q.text).then(hymn => {
          data = hymn.data
          const {text} = hymn;

          this.talk(`open:location`, {
            id: this.uid(),
            data: `We are studying ${hymn.title} of the Rig Veda`,
            created: Date.now()
          });

          this.talk(`open:topic`, {
            id: this.uid(),
            data: `Current topic is Rig Veda hymn ${text}`,
            created: Date.now(),
          });

          return this.question(`${this.askChr}feecting parse:${agent.key} ${text}`);
        }).then(feecting => {
          return resolve({
            text:feecting.a.text,
            html:feecting.a.html,
            data,
          });
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      });
    },
    /**************
    method: speak
    params: packet
    describe: Speak a hymn using the speech services
    ***************/
    speak(packet) {
      return new Promise((resolve, reject) => {
        const {profile} = this.agent();
        if (!packet) return resolve(this._messages.nopacket);

        this.context('speak', packet.q.text);
        this.func.hymn(packet.q.text).then(hymn => {
          // now that we have the hymn let's send it to the speech service
          return this.question(`${this.askChr}open speech:${profile.voice} ${hymn.data.text}`);
        }).then(speech => {
          return resolve({
            text: speech.a.text,
            html: speech.a.html,
            data: speech.a.data
          })
        }).catch(err => {
          return this.error(err, packet, reject)
        })
      });
    },

    /**************
    method: view
    params: packet
    describe: view helper that calls hym to allow view interactions.
    ***************/
    view(packet) {
      this.context('view');
      return this.methods.hymn(packet);
    },
    /**************
    method: learn
    params: packet
    describe: Call the learn function to read a specific book
    ***************/
    learn(packet) {
      this.context('learn');
      let data, text;
      return new Promise((resolve, reject) => {
        this.func.learn().then(learn => {
          data = learn.data;
          text = learn.text;
          packet.q.text = learn.text;
          return this.func.chat(packet);
        }).then(chat => {
          console.log('CHAT RETURN', chat);
          return this.question(`#feecting parse ${text}`);
        }).then(feecting => {
          this.func.learnHymns();
          return resolve({
            text: feecting.a.text,
            html: feecting.a.html,
            data,
          })
        }).catch(err => {
          return this.error(err, packet, reject);
        })
      });
    },
    async json(packet) {
      this.context('json');
      // here we want to build text files for all the books that we can use in a custom agent.
      // first we need to get all the books
      try {
        this.action('get', 'get books');
        const books = await this.func.books();
        books.data.books.forEach(async book => {
          this.action('get', `Get book ${book.key}`);
          const hymns = await this.func.book(book.key);
          const jsonbook = {
            id: this.uid(true),
            key: book.key,
            describe: book.describe,
            link: `https://indra.ai/rigveda/books/${book.key}.html`,
            hymns: [],
            copyright: '©2023 Quinn Michaels (indra.ai). All rights reserved.',
            created: this.formatDate(Date.now(), 'long', true),
          };

          const loopTo = hymns.data.hymns.length;
          for (var i = 0; i < loopTo; i++) {
            const {data} = await this.func.hymn(hymns.data.hymns[i].key);
            const hymn = {
              id: this.uid(true),
              key: data.key,
              book: data.book,
              title: data.title,
              link: `https://indra.ai/rigveda/hymns/${data.key}.html`,
              text:data.text,
              people: data.people,
              places: data.places,
              things: data.things,
              groups: data.groups,
              concepts: data.concepts,
              hash: data.hash,
              created: this.formatDate(Date.now(), 'long', true),
            };
            jsonbook.hymns.push(hymn);
          }

          const jsonfile = this.path.join(__dirname, 'data', 'json', `rigveda-book-${book.key}.json`);
          this.prompt(`writing json ${jsonfile}`)
          this.state('data', `Writing json ${jsonfile}`);
          this.fs.writeFileSync(jsonfile, JSON.stringify(jsonbook));
        });
      }
      catch (e) {
        return this.error(packet, e, Promise.reject());
      }
      finally {
        return await Promise.resolve({
          text: 'building json files',
          html: '<p>building json files</p>',
          data: false
        })
      }
    }
  },
  onDone(data) {
    this.func.learnSetup();
    return Promise.resolve(data);
  },
});
module.exports = VEDA
