---REM INSERTING into FEE_FORMULA
Insert into FEE_FORMULA (FEE_FORMULA_NAME,FIXED_FEE,PERCENTAGE_FEE,FEES_SUSP_ACC_CCY,MIN_FEE,MAX_FEE,APPLY_FEE,FEES_SUSP_ACC_NO,FEES_SUSP_ACC_OFFICE,OFFICE,DEPARTMENT,REC_STATUS,PROFILE_CHANGE_STATUS,EFFECTIVE_DATE,PENDING_ACTION,METHOD,FEE_CURRENCY,DEDUCT_FROM,FIXED_FEE_METHOD,TIME_STAMP,FEE_FORMULA_DESCRIPTION,UID_FEE_FORMULA,FEE_TYPE_NAME,VERSION_ID,TIER_TYPE,REBATE_REF_AMOUNT,FEE_TX_CD,USE_FEE_EXTR_SYSTEM) values ('LEAH TST FEES',0,2,null,1,2,'NOW',null,null,'--OFFICE--','--DEPARTMENT--','AC','NO',to_date('19-AUG-16','DD-MON-RR'),'UP','Regular','--CURRENCY--','A','M','2016-08-19 12:08:15.387','HKFast inward fee formula','--OFFICE--^LEAH TST FEES','LEAH',null,null,null,null,0);
Insert into FEE_FORMULA (FEE_FORMULA_NAME,FIXED_FEE,PERCENTAGE_FEE,FEES_SUSP_ACC_CCY,MIN_FEE,MAX_FEE,APPLY_FEE,FEES_SUSP_ACC_NO,FEES_SUSP_ACC_OFFICE,OFFICE,DEPARTMENT,REC_STATUS,PROFILE_CHANGE_STATUS,EFFECTIVE_DATE,PENDING_ACTION,METHOD,FEE_CURRENCY,DEDUCT_FROM,FIXED_FEE_METHOD,TIME_STAMP,FEE_FORMULA_DESCRIPTION,UID_FEE_FORMULA,FEE_TYPE_NAME,VERSION_ID,TIER_TYPE,REBATE_REF_AMOUNT,FEE_TX_CD,USE_FEE_EXTR_SYSTEM) values ('TESTFEENAME',100,0,'--CURRENCY--',null,null,'NOW','112233445566','--OFFICE--','--OFFICE--','--DEPARTMENT--','AC','NO',to_date('18-AUG-15','DD-MON-RR'),'UP','Regular','--CURRENCY--','P','M','2016-07-05 13:13:10.451','TEST Fee','--OFFICE--^TESTFEENAME','TESTFEE',null,null,null,null,0);
