#include "incomes.h"
#include "expenses.h"
#include "shared.h"
#include <ctype.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

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

int monthly_history(){
    char month[MAX_MONTHS][MAX_MONTH_CHAR];
    char temp_month[MAX_MONTH_CHAR];

    bool already_exists;
    int month_count = 0;
    float balance;

    //read income file
    char *incomes = "incomes.txt";
    FILE *income_file = fopen(incomes, "r");
    if(income_file == NULL){
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", incomes);
        return 1;
    }

    char line[256];
    while(fgets(line, sizeof(line), income_file)){
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
        for(int i = 0; i < MAX_MONTH_CHAR; i++){
            if(i < MAX_MONTH_CHAR-1){
                temp_month[i] = date[i+3];
            } else {
                temp_month[i] = '\0';
            }
        }

        already_exists = false;
        for(int i = 0; i < month_count; i++){
            if(strcmp(temp_month, month[i]) == 0){
                already_exists = true;
                break;
            }
        }

        if(already_exists == false){
            strcpy(month[month_count], temp_month);
            month_count++;
        }
    }

    fclose(income_file);

    char *expenses_filename = "expenses.txt";
    FILE *expenses_file = fopen(expenses_filename, "r");
    if(expenses_file == NULL){
        printf("❌ Error: Unable to access %s. Please check permissions or file integrity.\n", incomes);
        return 1;
    }

    while(fgets(line, sizeof(line), expenses_file)){
        char *desc = strtok(line, ",");
        if(desc == NULL){
            continue;
        }

        char *amount = strtok(NULL, ",");
        if(amount == NULL){
            continue;
        }
        char *cat = strtok(NULL, ",");
        if(cat == NULL){
            continue;
        }
        char *data = strtok(NULL, ",");
        if(data == NULL){
            continue;
        }

        for(int i = 0; i < MAX_MONTH_CHAR; i++){
            if(i < MAX_MONTH_CHAR-1){
                temp_month[i] = data[i+3];
            } else {
                temp_month[i] = '\0';
            }
        }

        already_exists = false;
        for(int i = 0; i < month_count; i++){
            if(strcmp(temp_month, month[i]) == 0){
                already_exists = true;
                break;
            }
        }
        
        if(already_exists == false){
            strcpy(month[month_count], temp_month);
            month_count++;
        }
    }

    fclose(expenses_file);

    
    for(int i = 0; i < month_count; i++){
        float total_income_variable = total_income(month[i]);
        float total_expense_variable = expenses_sum(month[i]);
        balance = total_income_variable - total_expense_variable;
        int num_bars = (int)balance/50;
        printf("📅 %-10s  💵 $%-10.2f  💸 $%-10.2f  🧮 Balance: $%-10.2f | ", month[i], total_income_variable, total_expense_variable, balance);
        for(int i = 0; i < num_bars; i++){
            printf("█");
        }
        printf("\n");
    }
    return 0;
}