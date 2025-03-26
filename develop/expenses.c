#include "expenses.h"
#include <stdlib.h>
#include <ctype.h>
#include <stdio.h>


void add_expense(){
    int clear;
    printf("Expense short description: ");
    fgets(expense.description, sizeof(expense.description), stdin);
    while((clear = getchar()) != '\n' && clear != EOF);
    int des_length = strlen(expense.description);
    if(des_length > 0 && expense.description[des_length - 1] == '\n'){
        expense.description[des_length - 1] = '\0';
    }
    
    printf("How much did you spend: ");
    scanf("%f", &expense.amount);
    while((clear = getchar()) != '\n' && clear != EOF);
    
    printf("Expense category: ");
    fgets(expense.category, sizeof(expense.category), stdin);
    while((clear = getchar()) != '\n' && clear != EOF);
    int cat_length = strlen(expense.category);
    if(cat_length > 0 && expense.category[cat_length - 1] == '\n'){
        expense.category[cat_length - 1] = '\0';
    }
    
    printf("When did you bought it [MM/DD/YY]: ");
    fgets(expense.date, sizeof(expense.date), stdin);
    while((clear = getchar()) != '\n' && clear != EOF);
    int date_length = strlen(expense.date);
    if(date_length > 0 && expense.date[date_length - 1] == '\n'){
        expense.date[date_length - 1] = '\0';
    }
}

void list_expenses(){

}