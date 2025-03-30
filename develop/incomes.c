#include "incomes.h"
#include <ctype.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

int write_income(Income *income){
    char *outgoings = "incomes.txt";
    FILE *outfile = fopen(outgoings, "a");
    if(outfile == NULL){
        printf("Could not open %s.\n");
        return 1;
    }
    fprintf(outfile, "%s,%.2f,%s", income->category, income->amount, income->date);

    fclose(outfile);

    printf("\n✅ Income added succesfully!\n");

    return 0;
}

void add_income(Income *income){
    char temp[MAX_DATE];
    int clear;
    while((clear = getchar()) != '\n' && clear != EOF);

    printf("\nIncome category: ");
    if(fgets(income->category, sizeof(income->category), stdin) != NULL){
        income->category[strcspn(income->category, "\n")] = '\0';
    }

    printf("\nIncome amount: ");
    if(fgets(temp, sizeof(temp), stdin) != NULL){
        income->amount = atof(temp);
    }

    printf("\nWhen did you receive this money [DD/MM/YY]: ");
    if(fgets(income->date, sizeof(income->date), stdin) != NULL){
        income->date[strcspn(income->date, "\n")] = '\0';
    }
}

int total_income(){

}