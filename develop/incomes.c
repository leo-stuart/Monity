#include "incomes.h"
#include <ctype.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

int write_income(Income *income){
    char *outgoings = "incomes.txt";
    FILE *outfile = fopen(outgoings, "a");
    if(outfile == NULL){
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }
    fprintf(outfile, "%s,%.2f,%s\n", income->category, income->amount, income->date);

    fclose(outfile);

    printf("\n✅ Income added succesfully!\n");

    return 0;
}

void add_income(Income *income){
    char temp[MAX_DATE];
    int clear;
    while((clear = getchar()) != '\n' && clear != EOF);

    printf("\n📌 Income category: ");
    if(fgets(income->category, sizeof(income->category), stdin) != NULL){
        income->category[strcspn(income->category, "\n")] = '\0';
    }

    printf("\n💰 Income amount: ");
    if(fgets(temp, sizeof(temp), stdin) != NULL){
        income->amount = atof(temp);
    }

    printf("\n🗓️ When did you receive this money [DD/MM/YY]: ");
    if(fgets(income->date, sizeof(income->date), stdin) != NULL){
        income->date[strcspn(income->date, "\n")] = '\0';
    }
}

float total_income(char month_to_sum[]){
    float total = 0;
    char *outgoings = "incomes.txt";
    FILE *outfile = fopen(outgoings, "r");
    if(outfile == NULL){
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", outgoings);
        return 1;
    }

    char line[256];
    while (fgets(line, sizeof(line), outfile)){
        char *cat = strtok(line, ",");
        if(cat == NULL){
            continue;
        }

        char *amount = strtok(NULL, ",");
        if(amount == NULL){
            continue;
        }

        char *date = strtok(NULL, ",");
        if(date == NULL){
            continue;
        }

        char *appears = strstr(date, month_to_sum);

        if(appears != NULL){
            float amount_int = atof(amount);
            total += amount_int;
        }
    }
    
    fclose(outfile);
    
    return total;

}