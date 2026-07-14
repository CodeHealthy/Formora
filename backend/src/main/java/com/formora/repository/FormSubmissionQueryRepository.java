package com.formora.repository;

import com.formora.model.FormSubmission;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

@Repository
public class FormSubmissionQueryRepository {

    private static final int MAXIMUM_EXPORT_ROWS = 50_001;
    private final MongoTemplate mongoTemplate;

    public FormSubmissionQueryRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public Page<FormSubmission> findPage(
            String formId,
            Integer publicationVersion,
            Instant from,
            Instant to,
            int page,
            int pageSize
    ) {
        Query query = query(formId, publicationVersion, from, to);
        long total = mongoTemplate.count(query, FormSubmission.class);
        PageRequest pageable = PageRequest.of(
                page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")
        );
        List<FormSubmission> submissions = mongoTemplate.find(query.with(pageable), FormSubmission.class);
        return new PageImpl<>(submissions, pageable, total);
    }

    public List<FormSubmission> findForExport(
            String formId,
            int publicationVersion,
            Instant from,
            Instant to
    ) {
        Query query = query(formId, publicationVersion, from, to)
                .with(Sort.by(Sort.Direction.ASC, "createdAt"))
                .limit(MAXIMUM_EXPORT_ROWS);
        return mongoTemplate.find(query, FormSubmission.class);
    }

    private Query query(String formId, Integer publicationVersion, Instant from, Instant to) {
        Criteria criteria = Criteria.where("formId").is(formId);
        if (publicationVersion != null) {
            criteria = criteria.and("publicationVersion").is(publicationVersion);
        }
        if (from != null || to != null) {
            Criteria createdAt = criteria.and("createdAt");
            if (from != null) createdAt = createdAt.gte(from);
            if (to != null) createdAt.lte(to);
        }
        return Query.query(criteria);
    }
}
