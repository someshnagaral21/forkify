import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';
import Likes from './models/Likes';

/** Global state of the app 
 * -Search object
 * -Current recipe object
 * -Shopping list object
 * -Liked recipes
*/

const state =   {};
//SEARCH CONTROLLER

const controlSearch = async () => {
    // -Get query from view
    const query    =    searchView.getInput();

    if(query){
        // -New search object add it to state
        state.search    =   new Search(query);

        // -Prepare UI for display
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try{
            // -Search for recipes
            await state.search.getResults();
    
            // -render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        }
        catch(err){
            alert('Something wrong with the search!');
            clearLoader();
        }
    }

}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});



elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');

    if(btn)
    {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }

    
});

//RECIPE CONTROLLER


const controlRecipe = async () => {

    //Get id from url
    const id = window.location.hash.replace('#', '');


    if(id)
    {
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight selected search item
        if(state.search) searchView.highLightSelected(id);

        //Create new recipe obj
        state.recipe = new Recipe(id);

        try{
            //Get recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            //Cal servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            //Render recipe
            clearLoader();
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id)
                );
        }
        catch(err){
            alert('Error processing recipe!');
        }
            
    }
}

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//LIST CONTROLLER

const controlList = () => {
    //Create n new list if there is none yet
    if(!state.list) state.list = new List();

    //Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *'))
    {   
        //Delete from state
        state.list.deleteItem(id);
        //Delete from UI
        listView.deleteItem(id);
        
    }
    //Handle count update
    else if(e.target.matches('.shopping__count-value'))
    {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

//LIKE CONTROLLER

const controlLike = () => {
    if(!state.likes) state.likes = new Likes();

    const currentID = state.recipe.id;

    //User has not yet liked recipe
    if(!state.likes.isLiked(currentID))
    {
        //Add like to state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        //Toggle like button
        likesView.toggleLikeBtn(true);    
        //Add like to UI list
        likesView.renderLike(newLike);
    }
    //User has liked recipe
    else
    {
        //Remove like from state
        state.likes.deleteLike(currentID);
        //Toggle like button
        likesView.toggleLikeBtn(false);  
        //Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();

    //Restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    //Render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *'))
    {
        //Decrease button clicked
        if(state.recipe.servings > 1)
        {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    }
    else if(e.target.matches('.btn-increase, .btn-increase *'))
    {
        //Increase button clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    }
    else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *'))
    {
        //Add ing to shopping list
        controlList();
    }
    else if(e.target.matches('.recipe__love, .recipe__love *'))
    {
        //Like controller
        controlLike();
    }

});
