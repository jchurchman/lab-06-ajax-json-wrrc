'use strict';

function Article (rawDataObj) {
  this.author = rawDataObj.author;
  this.authorUrl = rawDataObj.authorUrl;
  this.title = rawDataObj.title;
  this.category = rawDataObj.category;
  this.body = rawDataObj.body;
  this.publishedOn = rawDataObj.publishedOn;
}

// REVIEW: Instead of a global `articles = []` array, let's track this list of all articles directly on the
// constructor function. Note: it is NOT on the prototype. In JavaScript, functions are themselves
// objects, which means we can add properties/values to them at any time. In this case, we have
// a key/value pair to track, that relates to ALL of the Article objects, so it does not belong on
// the prototype, as that would only be relevant to a single instantiated Article.
Article.all = [];

Article.prototype.toHtml = function() {
  let template = Handlebars.compile($('#article-template').text());

  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';
  this.body = marked(this.body);

  return template(this);
};

// REVIEW: There are some other functions that also relate to articles across the board, rather than
// just single instances. Object-oriented programming would call these "class-level" functions,
// that are relevant to the entire "class" of objects that are Articles.

// REVIEW: This function will take the rawData, however it is provided,
// and use it to instantiate all the articles. This code is moved from elsewhere, and
// encapsulated in a simply-named function for clarity.
Article.loadAll = function(rawData) {
  rawData.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  rawData.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
}

Article.runWhenDone = function (data) {
  localStorage.setItem('rawData', JSON.stringify(data));
  Article.loadAll( data );
  articleView.initIndexPage();
}

Article.runWhenErr = function ( err ) {
  console.error( 'error', err );
}

Article.getDBData = function () {
  $.ajax({
    type: 'GET',
    url: './data/hackerIpsum.json',
    success: Article.runWhenDone,
    error: Article.runWhenErr
  })
}

Article.checkETag = function () {
  $.ajax({
    type: 'HEAD',
    url: './data/hackerIpsum.json',
    success: Article.validateETag,
    error: Article.runWhenErr
  })
}

Article.validateETag = function(data, message, xhr) {
  var eTag = xhr.getResponseHeader('ETag');
  if ( eTag === JSON.parse(localStorage.getItem('lsETag'))){
    Article.loadAll( JSON.parse(localStorage.rawData) )
    articleView.initIndexPage();
  } else {
    localStorage.setItem('lsETag', JSON.stringify(eTag));
    Article.getDBData();
  }
}