// Global app controller

import Search from './models/Search'; 
import {elements, renderLoader, clearLoader} from './views/base';
import * as searchView from './views/searchView';
import * as reciepeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import { STATUS_CODES } from 'http';
import Likes from './models/Likes';

/** global state of the app
 * - Search object
 * - Current recipe object
 * - Liked recipes
*/
const state = {};

// Search Controller
const controlSearch = async () => {
    //1) We should get the query from the view
    const query = searchView.getInput();


    if(query) {
        //2) New Search object and add to state
        state.search = new Search(query);

        //3) Prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            //4) Search for recipes
            await state.search.getResults();

            //5) Render results on UI
           // console.log(state.search.result);
            clearLoader();
            searchView.renderResults(state.search.result);

        } catch (err) {
            alert( 'Something went wrong while searching');
            clearLoader();
        }
            
    }
}

elements.searchForm.addEventListener('submit', e =>{
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e=>{
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
       // console.log(goToPage);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
})


//Recipe Controller
const controlRecipe = async () => {
  //Get Id from URL
   const id = window.location.hash.replace('#','');
  // console.log(id);
   if (id) {
        // Prepare UI for changes
        reciepeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected search item
        if( state.search) searchView.highlightedSelected(id);
        //chreate new recipe object
        state.recipe = new Recipe(id);
        
        try {
            //get recipe data and parse the ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            //calc time and servings
            state.recipe.calTime();
            state.recipe.calServings();

            //render the recipe
            clearLoader();
            reciepeView.renderReciepe(state.recipe, state.likes.isLiked(id));
            console.log(state.recipe);
        } catch(err) {
            alert('Error processing recipe');
        }
        
        
   }
}


// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load',controlRecipe);
['hashchange','load'].forEach(event => window.addEventListener(event,controlRecipe));



/* 
* List Controller
*/

const controlList = () =>{
    //create a new list if there is no list yet
    if (!state.list) state.list = new List();

    //add each ingredient to the list and user interface
    state.recipe.ingredients.forEach( el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);
    });
}
//Hndle delete and update list item events

elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    
   
    //Handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete from state
        state.list.deleteItem(id);
        //delete from user interface
        listView.deleteItem(id);
    } else if (e.target.matches('.shopping__count-value')) {
        //handling the count update
        const val = parseFloat(e.target.value,10);
        state.list.updateCount(id, val);
    }
});


/* 
* Like Controller
*/

//testing

const controlLike = ()=>{
    if(!state.likes) state.likes = new Likes();
    const currentId = state.recipe.id;
    
    if (!state.likes.isLiked(currentId)) {
        //user had not yet liked current recipe
        
        //1. Add like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img,
        )

        //2.Toggle the like button
        likesView.toggleLikeBtn(true);

        //3.Add like to the UI List
        likesView.renderLike(newLike);
        console.log(state.likes);
    } else {
        //user has liked the current recipe

        //1. Remove like from state
        state.likes.deleteLike(currentId);

        //2.Toggle the like button
        likesView.toggleLikeBtn(false);

        //3.remove like from the UI List
        likesView.deleteLike(currentId);
        console.log(state.likes);

    }
    likesView.toggleLikeMenue(state.likes.getNumLikes());
};

//Restor likes recipe on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    
    //Restore likes
    state.likes.readStorage();

    //toggle the button
    likesView.toggleLikeMenue(state.likes.getNumLikes());

    //Render exisitng likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})


// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        //decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            reciepeView.updateServingsIngredients(state.recipe);
        }
        
    } else if( e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        reciepeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn-add, .recipe__btn-add *')) {
        //to add to list
        controlList();
    } else if(e.target.matches('.recipe__love, .recipe__love *')){
        //like controller
        controlLike();
        //
    }
    //console.log(state.recipe);
});

